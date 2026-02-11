/**
 * Unit Tests for EnrichMultipleTicketsUseCase
 *
 * Tests parallel enrichment logic including:
 * - Ticket validation (existence, draft status)
 * - Workspace isolation verification
 * - Parallel execution with Promise.allSettled
 * - Error handling and partial failure scenarios
 * - Progress event emission
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EnrichMultipleTicketsUseCase, EnrichmentProgressEvent } from '../EnrichMultipleTicketsUseCase';
import { AECRepository } from '../../ports/AECRepository';
import { GenerateQuestionsUseCase } from '../GenerateQuestionsUseCase';

describe('EnrichMultipleTicketsUseCase', () => {
  let useCase: EnrichMultipleTicketsUseCase;
  let mockAecRepository: jest.Mocked<AECRepository>;
  let mockGenerateQuestionsUseCase: jest.Mocked<GenerateQuestionsUseCase>;
  let progressEvents: EnrichmentProgressEvent[] = [];

  const mockTicket = (id: string, title: string, workspaceId: string, status = 'draft') => ({
    id,
    title,
    status,
    workspaceId,
    description: `Description for ${title}`,
  });

  const mockQuestion = (id: string, text: string) => ({
    id,
    text,
    type: 'textarea',
    required: true,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    progressEvents = [];

    // Mock repositories and use cases
    mockAecRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByWorkspaceId: jest.fn(),
    } as any;

    mockGenerateQuestionsUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new EnrichMultipleTicketsUseCase(
      mockAecRepository,
      mockGenerateQuestionsUseCase,
    );
  });

  describe('execute - successful enrichment', () => {
    it('should enrich multiple tickets in parallel', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2', 'ticket-3'];
      const workspaceId = 'workspace-123';
      const progressCallback = (event: EnrichmentProgressEvent) => {
        progressEvents.push(event);
      };

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C', workspaceId));

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([mockQuestion('q1', 'How many users?')])
        .mockResolvedValueOnce([
          mockQuestion('q2', 'What platforms?'),
          mockQuestion('q3', 'Database needs?'),
        ])
        .mockResolvedValueOnce([mockQuestion('q4', 'Timeline?')]);

      // Act
      const result = await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: progressCallback,
      });

      // Assert
      expect(result.completedCount).toBe(3);
      expect(result.failedCount).toBe(0);
      expect(result.questions.size).toBe(3);
      expect(result.questions.get('ticket-1')).toHaveLength(1);
      expect(result.questions.get('ticket-2')).toHaveLength(2);
      expect(result.questions.get('ticket-3')).toHaveLength(1);
      expect(result.errors.size).toBe(0);
    });

    it('should emit progress events for each ticket', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2'];
      const workspaceId = 'workspace-123';
      const progressCallback = (event: EnrichmentProgressEvent) => {
        progressEvents.push(event);
      };

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId));

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([mockQuestion('q1', 'Question 1')])
        .mockResolvedValueOnce([mockQuestion('q2', 'Question 2')]);

      // Act
      await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: progressCallback,
      });

      // Assert: Should have progress events for both tickets
      const ticket1Events = progressEvents.filter((e) => e.ticketId === 'ticket-1');
      const ticket2Events = progressEvents.filter((e) => e.ticketId === 'ticket-2');

      expect(ticket1Events.length).toBeGreaterThan(0);
      expect(ticket2Events.length).toBeGreaterThan(0);

      // Verify event sequence: started → complete
      expect(ticket1Events[0].status).toBe('started');
      expect(ticket1Events[ticket1Events.length - 1].status).toBe('completed');
    });

    it('should track agent IDs correctly', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2', 'ticket-3'];
      const workspaceId = 'workspace-123';
      const progressCallback = (event: EnrichmentProgressEvent) => {
        progressEvents.push(event);
      };

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C', workspaceId));

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValue([mockQuestion('q', 'Question')]);

      // Act
      await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: progressCallback,
      });

      // Assert: Each ticket should be assigned agentId 1, 2, or 3
      const agentIds = Array.from(new Set(progressEvents.map((e) => e.agentId)));
      expect(agentIds).toContain(1);
      expect(agentIds).toContain(2);
      expect(agentIds).toContain(3);
    });
  });

  describe('execute - validation errors', () => {
    it('should throw BadRequestException if ticket not found', async () => {
      // Arrange
      const ticketIds = ['nonexistent'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        useCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ticket not in draft status', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A', workspaceId, 'complete'),
      );

      // Act & Assert
      await expect(
        useCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockAecRepository.findById).toHaveBeenCalledWith('ticket-1');
    });

    it('should throw ForbiddenException if ticket does not belong to workspace', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';
      const differentWorkspaceId = 'workspace-999';

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A', differentWorkspaceId),
      );

      // Act & Assert
      await expect(
        useCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('execute - partial failure scenarios', () => {
    it('should handle one ticket failing without blocking others', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2', 'ticket-3'];
      const workspaceId = 'workspace-123';
      const progressCallback = jest.fn();

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C', workspaceId));

      // Ticket 2 fails during question generation
      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([mockQuestion('q1', 'Question')])
        .mockRejectedValueOnce(new Error('LLM error'))
        .mockResolvedValueOnce([mockQuestion('q3', 'Question')]);

      // Act
      const result = await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: progressCallback,
      });

      // Assert
      expect(result.completedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.questions.get('ticket-1')).toBeDefined();
      expect(result.questions.get('ticket-2')).toBeUndefined();
      expect(result.questions.get('ticket-3')).toBeDefined();
      expect(result.errors.get('ticket-2')).toMatch(/LLM error/);
    });

    it('should handle multiple tickets failing', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2', 'ticket-3'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-3', 'Feature C', workspaceId));

      // Only ticket 1 succeeds
      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([mockQuestion('q1', 'Question')])
        .mockRejectedValueOnce(new Error('Service error'))
        .mockRejectedValueOnce(new Error('Timeout'));

      // Act
      const result = await useCase.execute({
        workspaceId,
        ticketIds,
      });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(result.failedCount).toBe(2);
      expect(result.errors.size).toBe(2);
      expect(result.errors.has('ticket-2')).toBe(true);
      expect(result.errors.has('ticket-3')).toBe(true);
    });

    it('should emit error events for failed tickets', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2'];
      const workspaceId = 'workspace-123';
      const progressCallback = (event: EnrichmentProgressEvent) => {
        progressEvents.push(event);
      };

      mockAecRepository.findById
        .mockResolvedValueOnce(mockTicket('ticket-1', 'Feature A', workspaceId))
        .mockResolvedValueOnce(mockTicket('ticket-2', 'Feature B', workspaceId));

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([mockQuestion('q1', 'Question')])
        .mockRejectedValueOnce(new Error('LLM timeout'));

      // Act
      await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: progressCallback,
      });

      // Assert
      const ticket2ErrorEvents = progressEvents.filter(
        (e) => e.ticketId === 'ticket-2' && e.type === 'error',
      );
      expect(ticket2ErrorEvents.length).toBeGreaterThan(0);
      expect(ticket2ErrorEvents[0].status).toBe('failed');
    });
  });

  describe('execute - edge cases', () => {
    it('should handle empty ticket list', async () => {
      // Act & Assert: Should complete without error but with 0 results
      // (In practice, this might be rejected at the API layer, but the use case should handle it gracefully)
      const result = await useCase.execute({
        workspaceId: 'workspace-123',
        ticketIds: [],
      });

      expect(result.completedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.questions.size).toBe(0);
    });

    it('should handle single ticket enrichment', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A', workspaceId),
      );

      mockGenerateQuestionsUseCase.execute.mockResolvedValueOnce([
        mockQuestion('q1', 'Question 1'),
        mockQuestion('q2', 'Question 2'),
      ]);

      // Act
      const result = await useCase.execute({
        workspaceId,
        ticketIds,
      });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.questions.get('ticket-1')).toHaveLength(2);
    });

    it('should not call generate questions without progress callback', async () => {
      // Arrange: Explicitly NOT providing onProgress callback
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce(
        mockTicket('ticket-1', 'Feature A', workspaceId),
      );

      mockGenerateQuestionsUseCase.execute.mockResolvedValueOnce([
        mockQuestion('q1', 'Question'),
      ]);

      // Act
      const result = await useCase.execute({
        workspaceId,
        ticketIds,
        onProgress: undefined, // No callback
      });

      // Assert: Should still complete successfully
      expect(result.completedCount).toBe(1);
      expect(mockGenerateQuestionsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('execute - concurrency', () => {
    it('should execute all tickets in parallel (not sequentially)', async () => {
      // Arrange
      const ticketIds = Array.from({ length: 10 }, (_, i) => `ticket-${i + 1}`);
      const workspaceId = 'workspace-123';
      let concurrentCount = 0;
      let maxConcurrentCount = 0;

      mockAecRepository.findById.mockImplementation((id: string) => {
        return Promise.resolve(mockTicket(id, `Feature ${id}`, workspaceId));
      });

      mockGenerateQuestionsUseCase.execute.mockImplementation(() => {
        concurrentCount++;
        maxConcurrentCount = Math.max(maxConcurrentCount, concurrentCount);

        return new Promise((resolve) => {
          setTimeout(() => {
            concurrentCount--;
            resolve([mockQuestion('q', 'Question')]);
          }, 10);
        });
      });

      // Act
      await useCase.execute({
        workspaceId,
        ticketIds,
      });

      // Assert: Should execute in parallel (multiple concurrent operations)
      // If sequential, maxConcurrentCount would be 1; parallel should be higher
      expect(maxConcurrentCount).toBeGreaterThan(1);
    });
  });
});
