import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { StartFinalizationUseCase } from '../StartFinalizationUseCase';
import { JobRepository } from '../../ports/JobRepository.port';
import { AECRepository } from '../../../../tickets/application/ports/AECRepository';
import { UsageBudgetRepository } from '../../../../shared/application/ports/UsageBudgetRepository';
import { BackgroundFinalizationService } from '../../services/BackgroundFinalizationService';
import { AEC } from '../../../../tickets/domain/aec/AEC';
import { GenerationJob } from '../../../domain/GenerationJob';
import { UsageBudget } from '../../../../shared/domain/usage/UsageBudget';

describe('StartFinalizationUseCase', () => {
  let useCase: StartFinalizationUseCase;
  let mockJobRepository: jest.Mocked<JobRepository>;
  let mockAecRepository: jest.Mocked<AECRepository>;
  let mockUsageBudgetRepository: jest.Mocked<UsageBudgetRepository>;
  let mockBackgroundService: jest.Mocked<Pick<BackgroundFinalizationService, 'run'>>;

  const defaultCommand = {
    ticketId: 'aec_ticket-123',
    userId: 'user-456',
    teamId: 'team-789',
  };

  const defaultBudget: UsageBudget = {
    teamId: 'team-789',
    month: '2026-03',
    tokensUsed: 1000,
    tokenLimit: 500_000,
    ticketsCreatedToday: 2,
    dailyTicketLimit: 20,
    lastResetDate: '2026-03-20',
  };

  /** Create a draft AEC with answers so it passes validation */
  const createDraftAecWithAnswers = (
    teamId: string = defaultCommand.teamId,
    userId: string = defaultCommand.userId,
  ): AEC => {
    const aec = AEC.createDraft(teamId, userId, 'Test Ticket Title', 'A description');
    // Simulate that questions have been answered by setting questionAnswers
    aec.setQuestions([
      {
        id: 'q1',
        question: 'What framework?',
        type: 'radio' as const,
        options: ['React', 'Vue'],
      },
    ]);
    aec.recordQuestionAnswers({ q1: 'React' });
    return aec;
  };

  beforeEach(() => {
    mockJobRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(null),
      findActiveByUser: jest.fn().mockResolvedValue([]),
      findActiveByTicket: jest.fn().mockResolvedValue(null),
      findRecentByUser: jest.fn().mockResolvedValue([]),
      findOrphaned: jest.fn().mockResolvedValue([]),
      updateProgress: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue(null),
      pruneExpired: jest.fn().mockResolvedValue(0),
    };

    mockAecRepository = {
      findById: jest.fn(),
      findByIdInTeam: jest.fn(),
      findBySlug: jest.fn(),
      findByTeam: jest.fn(),
      findArchivedByTeam: jest.fn(),
      countByTeam: jest.fn(),
      countByTeamAndCreator: jest.fn(),
      getNextTicketNumber: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      updateTicketFolder: jest.fn().mockResolvedValue(undefined),
      clearFolderFromTickets: jest.fn().mockResolvedValue(undefined),
    };

    mockUsageBudgetRepository = {
      getOrCreate: jest.fn().mockResolvedValue(defaultBudget),
      incrementTokens: jest.fn().mockResolvedValue(defaultBudget),
      incrementDailyTickets: jest.fn().mockResolvedValue(defaultBudget),
    };

    mockBackgroundService = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new StartFinalizationUseCase(
      mockJobRepository,
      mockAecRepository,
      mockUsageBudgetRepository,
      mockBackgroundService as unknown as BackgroundFinalizationService,
    );
  });

  describe('Success', () => {
    it('should create a job, set AEC generationJobId, and spawn async finalization', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);

      // When
      const result = await useCase.execute(defaultCommand);

      // Then
      expect(result.jobId).toBeDefined();
      expect(result.jobId).toMatch(/^job_/);

      // Verify job was saved
      expect(mockJobRepository.save).toHaveBeenCalledTimes(1);
      const savedJob = mockJobRepository.save.mock.calls[0][0];
      expect(savedJob).toBeInstanceOf(GenerationJob);
      expect(savedJob.ticketId).toBe(defaultCommand.ticketId);
      expect(savedJob.createdBy).toBe(defaultCommand.userId);
      expect(savedJob.teamId).toBe(defaultCommand.teamId);
      expect(savedJob.status).toBe('running');

      // Verify AEC was updated with generationJobId
      expect(aec.generationJobId).toBe(result.jobId);
      expect(mockAecRepository.save).toHaveBeenCalledWith(aec);

      // Verify background finalization was spawned
      expect(mockBackgroundService.run).toHaveBeenCalledWith(
        result.jobId,
        defaultCommand.ticketId,
        defaultCommand.teamId,
      );
    });
  });

  describe('Validation errors', () => {
    it('should throw NotFoundException when AEC not found', async () => {
      // Given
      mockAecRepository.findById.mockResolvedValue(null);

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(
        `Ticket ${defaultCommand.ticketId} not found`,
      );

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when ticket does not belong to team', async () => {
      // Given
      const aec = createDraftAecWithAnswers('different-team-id');
      mockAecRepository.findById.mockResolvedValue(aec);

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(ForbiddenException);
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(
        'Ticket does not belong to your team',
      );

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when AEC has no answers', async () => {
      // Given: AEC with questions but no answers
      const aec = AEC.createDraft(
        defaultCommand.teamId,
        defaultCommand.userId,
        'Test Ticket',
        'Description',
      );
      // Add questions so the no-answers validation is triggered
      aec.setQuestions([
        {
          id: 'q1',
          question: 'What framework?',
          type: 'radio' as const,
          options: ['React', 'Vue'],
        },
      ]);
      mockAecRepository.findById.mockResolvedValue(aec);

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(
        'must have answered questions',
      );

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when quota exceeded', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);
      mockUsageBudgetRepository.getOrCreate.mockResolvedValue({
        ...defaultBudget,
        tokensUsed: 500_000,
        tokenLimit: 500_000,
      });

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(ForbiddenException);

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when active job already exists for ticket', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);

      const existingJob = GenerationJob.createNew(
        defaultCommand.teamId,
        defaultCommand.ticketId,
        'Test',
        defaultCommand.userId,
      );
      mockJobRepository.findActiveByTicket.mockResolvedValue(existingJob);

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(
        'already has an active generation job',
      );

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });

    it('should throw HttpException 429 when user has 3 active jobs', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);

      const activeJobs = [
        GenerationJob.createNew(defaultCommand.teamId, 'ticket-1', 'Job 1', defaultCommand.userId),
        GenerationJob.createNew(defaultCommand.teamId, 'ticket-2', 'Job 2', defaultCommand.userId),
        GenerationJob.createNew(defaultCommand.teamId, 'ticket-3', 'Job 3', defaultCommand.userId),
      ];
      mockJobRepository.findActiveByUser.mockResolvedValue(activeJobs);

      // When/Then
      await expect(useCase.execute(defaultCommand)).rejects.toThrow(HttpException);

      try {
        await useCase.execute(defaultCommand);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(429);
        expect((error as HttpException).message).toContain('Too many active jobs');
      }

      expect(mockJobRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should allow finalization when user has fewer than 3 active jobs', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);

      const activeJobs = [
        GenerationJob.createNew(defaultCommand.teamId, 'ticket-1', 'Job 1', defaultCommand.userId),
        GenerationJob.createNew(defaultCommand.teamId, 'ticket-2', 'Job 2', defaultCommand.userId),
      ];
      mockJobRepository.findActiveByUser.mockResolvedValue(activeJobs);

      // When
      const result = await useCase.execute(defaultCommand);

      // Then
      expect(result.jobId).toBeDefined();
      expect(mockJobRepository.save).toHaveBeenCalled();
    });

    it('should not block on background service failure', async () => {
      // Given
      const aec = createDraftAecWithAnswers();
      mockAecRepository.findById.mockResolvedValue(aec);
      mockBackgroundService.run.mockRejectedValue(new Error('LLM blew up'));

      // When: execute should still return successfully (fire-and-forget)
      const result = await useCase.execute(defaultCommand);

      // Then
      expect(result.jobId).toBeDefined();
      expect(mockJobRepository.save).toHaveBeenCalled();
    });
  });
});
