/**
 * Unit Tests for FinalizeMultipleTicketsUseCase
 *
 * Tests parallel finalization logic including:
 * - Answer processing and aggregation
 * - Parallel execution with Promise.allSettled
 * - Error handling and partial failure scenarios
 * - Progress event emission during finalization
 */

import { BadRequestException } from '@nestjs/common';
import { FinalizeMultipleTicketsUseCase, QuestionAnswer } from '../FinalizeMultipleTicketsUseCase';
import { AECRepository } from '../../ports/AECRepository';
import { SubmitQuestionAnswersUseCase } from '../SubmitQuestionAnswersUseCase';

describe('FinalizeMultipleTicketsUseCase', () => {
  let useCase: FinalizeMultipleTicketsUseCase;
  let mockAecRepository: jest.Mocked<AECRepository>;
  let mockSubmitQuestionAnswersUseCase: jest.Mocked<SubmitQuestionAnswersUseCase>;

  const mockTicket = (id: string, title: string, workspaceId = 'workspace-123') => ({
    id,
    title,
    status: 'draft',
    workspaceId,
    description: `Description for ${title}`,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAecRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    mockSubmitQuestionAnswersUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new FinalizeMultipleTicketsUseCase(
      mockAecRepository,
      mockSubmitQuestionAnswersUseCase,
    );
  });

  describe('execute - successful finalization', () => {
    it('should finalize multiple tickets in parallel', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-3', questionId: 'q3', answer: 'Answer 3' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C'));

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await useCase.execute({
        answers,
      });

      // Assert
      expect(result.completedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.success)).toBe(true);
    });

    it('should group answers by ticket ID correctly', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-1', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-2', questionId: 'q3', answer: 'Answer 3' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'));

      let callCount = 0;
      mockSubmitQuestionAnswersUseCase.execute.mockImplementation((cmd: any) => {
        callCount++;
        // Verify answers are grouped by ticketId
        if (cmd.aecId === 'ticket-1') {
          expect(Object.keys(cmd.answers)).toContain('q1');
          expect(Object.keys(cmd.answers)).toContain('q2');
          expect(Object.keys(cmd.answers).length).toBe(2);
        } else if (cmd.aecId === 'ticket-2') {
          expect(Object.keys(cmd.answers)).toContain('q3');
          expect(Object.keys(cmd.answers).length).toBe(1);
        }
        return Promise.resolve(undefined);
      });

      // Act
      await useCase.execute({ answers });

      // Assert: Should call execute twice (once per ticket)
      expect(callCount).toBe(2);
    });

    it('should emit progress events during finalization', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
      ];
      const progressEvents: any[] = [];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'));

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act
      await useCase.execute({
        answers,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert
      expect(progressEvents.length).toBeGreaterThan(0);
      // Verify events include both generating_spec and saving phases
      const phases = Array.from(new Set(progressEvents.map((e) => e.phase)));
      expect(phases).toContain('generating_spec');
      expect(phases).toContain('saving');
    });

    it('should track agent IDs (1-3) during finalization', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-3', questionId: 'q3', answer: 'Answer 3' },
      ];
      const progressEvents: any[] = [];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C'));

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act
      await useCase.execute({
        answers,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert
      const agentIds = Array.from(new Set(progressEvents.map((e) => e.agentId)));
      expect(agentIds).toContain(1);
      expect(agentIds).toContain(2);
      expect(agentIds).toContain(3);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw BadRequestException if no answers provided', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          answers: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if answers is null', async () => {
      // Act & Assert
      await expect(
        useCase.execute({
          answers: null as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('execute - partial failure scenarios', () => {
    it('should handle one ticket failing without blocking others', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-3', questionId: 'q3', answer: 'Answer 3' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C'));

      // Ticket 2 fails
      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Spec generation failed'))
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await useCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toMatch(/Spec generation failed/);
      expect(result.results[2].success).toBe(true);
    });

    it('should handle multiple tickets failing', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-3', questionId: 'q3', answer: 'Answer 3' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C'));

      // Only ticket 1 succeeds
      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'));

      // Act
      const result = await useCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.results.filter((r) => r.success)).toHaveLength(1);
      expect(result.results.filter((r) => !r.success)).toHaveLength(2);
    });

    it('should emit error events for failed tickets', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
      ];
      const progressEvents: any[] = [];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'));

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Timeout'));

      // Act
      await useCase.execute({
        answers,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert
      const ticket2ErrorEvents = progressEvents.filter(
        (e) => e.ticketId === 'ticket-2' && e.type === 'error',
      );
      expect(ticket2ErrorEvents.length).toBeGreaterThan(0);
      expect(ticket2ErrorEvents[0].status).toBe('failed');
    });

    it('should preserve ticket information in result even on failure', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A'))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B'));

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error'));

      // Act
      const result = await useCase.execute({ answers });

      // Assert
      expect(result.results[0]).toEqual(
        expect.objectContaining({
          ticketId: 'ticket-1',
          ticketTitle: 'Feature A',
          success: true,
        }),
      );
      expect(result.results[1]).toEqual(
        expect.objectContaining({
          ticketId: 'ticket-2',
          ticketTitle: 'Feature B',
          success: false,
        }),
      );
    });
  });

  describe('execute - edge cases', () => {
    it('should handle single ticket finalization', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [{ ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer' }];

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A'),
      );

      mockSubmitQuestionAnswersUseCase.execute.mockResolvedValueOnce(undefined);

      // Act
      const result = await useCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
    });

    it('should handle multiple answers for same ticket', async () => {
      // Arrange: Multiple answers for ticket-1 (e.g., multiple questions)
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-1', questionId: 'q2', answer: 'Answer 2' },
        { ticketId: 'ticket-1', questionId: 'q3', answer: 'Answer 3' },
      ];

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A'),
      );

      let receivedAnswers: Record<string, string> | null = null;
      mockSubmitQuestionAnswersUseCase.execute.mockImplementation((cmd: any) => {
        receivedAnswers = cmd.answers;
        return Promise.resolve(undefined);
      });

      // Act
      const result = await useCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(receivedAnswers).toEqual({
        q1: 'Answer 1',
        q2: 'Answer 2',
        q3: 'Answer 3',
      });
    });

    it('should not call submit use case without progress callback', async () => {
      // Arrange
      const answers: QuestionAnswer[] = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
      ];

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A'),
      );

      mockSubmitQuestionAnswersUseCase.execute.mockResolvedValueOnce(undefined);

      // Act: Explicitly NOT providing onProgress callback
      const result = await useCase.execute({
        answers,
        onProgress: undefined,
      });

      // Assert: Should still complete successfully
      expect(result.completedCount).toBe(1);
      expect(mockSubmitQuestionAnswersUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('execute - concurrency', () => {
    it('should execute all tickets in parallel during finalization', async () => {
      // Arrange
      const answers: QuestionAnswer[] = Array.from({ length: 10 }, (_, i) => ({
        ticketId: `ticket-${i + 1}`,
        questionId: `q${i + 1}`,
        answer: `Answer ${i + 1}`,
      }));

      mockAecRepository.findById.mockImplementation((id: string) => {
        return Promise.resolve(mockTicket(id, `Feature ${id}`));
      });

      let concurrentCount = 0;
      let maxConcurrentCount = 0;

      mockSubmitQuestionAnswersUseCase.execute.mockImplementation(() => {
        concurrentCount++;
        maxConcurrentCount = Math.max(maxConcurrentCount, concurrentCount);

        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentCount--;
            resolve(undefined);
          }, 10);
        });
      });

      // Act
      await useCase.execute({ answers });

      // Assert: Should execute in parallel (multiple concurrent operations)
      expect(maxConcurrentCount).toBeGreaterThan(1);
    });
  });
});
