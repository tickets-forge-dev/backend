/**
 * Integration Tests for Bulk Enrichment System
 *
 * Tests the complete enrichment and finalization flows using NestJS's Test module
 * to properly handle dependency injection.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EnrichMultipleTicketsUseCase } from '../../../tickets/application/use-cases/EnrichMultipleTicketsUseCase';
import { FinalizeMultipleTicketsUseCase } from '../../../tickets/application/use-cases/FinalizeMultipleTicketsUseCase';
import { GenerateQuestionsUseCase } from '../../../tickets/application/use-cases/GenerateQuestionsUseCase';
import { SubmitQuestionAnswersUseCase } from '../../../tickets/application/use-cases/SubmitQuestionAnswersUseCase';
import { AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';

describe('Bulk Enrichment Integration Tests', () => {
  let enrichUseCase: EnrichMultipleTicketsUseCase;
  let finalizeUseCase: FinalizeMultipleTicketsUseCase;
  let mockAecRepository: any;
  let mockGenerateQuestionsUseCase: any;
  let mockSubmitQuestionAnswersUseCase: any;

  beforeEach(async () => {
    // Mock repositories and services
    mockAecRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByWorkspaceId: jest.fn(),
    };

    mockGenerateQuestionsUseCase = {
      execute: jest.fn(),
    };

    mockSubmitQuestionAnswersUseCase = {
      execute: jest.fn(),
    };

    // Create a minimal test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichMultipleTicketsUseCase,
        FinalizeMultipleTicketsUseCase,
        {
          provide: AEC_REPOSITORY,
          useValue: mockAecRepository,
        },
        {
          provide: GenerateQuestionsUseCase,
          useValue: mockGenerateQuestionsUseCase,
        },
        {
          provide: SubmitQuestionAnswersUseCase,
          useValue: mockSubmitQuestionAnswersUseCase,
        },
      ],
    }).compile();

    enrichUseCase = module.get<EnrichMultipleTicketsUseCase>(EnrichMultipleTicketsUseCase);
    finalizeUseCase = module.get<FinalizeMultipleTicketsUseCase>(FinalizeMultipleTicketsUseCase);
  });

  describe('Enrichment Flow', () => {
    it('should enrich multiple tickets successfully', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById
        .mockResolvedValueOnce({
          id: 'ticket-1',
          title: 'Feature A',
          status: 'draft',
          workspaceId,
        })
        .mockResolvedValueOnce({
          id: 'ticket-2',
          title: 'Feature B',
          status: 'draft',
          workspaceId,
        });

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([{ id: 'q1', text: 'Question 1', type: 'textarea' }])
        .mockResolvedValueOnce([{ id: 'q2', text: 'Question 2', type: 'textarea' }]);

      // Act
      const result = await enrichUseCase.execute({
        workspaceId,
        ticketIds,
      });

      // Assert
      expect(result.completedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.questions.size).toBe(2);
    });

    it('should handle workspace verification error', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce({
        id: 'ticket-1',
        title: 'Feature A',
        status: 'draft',
        workspaceId: 'workspace-999', // Different workspace
      });

      // Act & Assert
      await expect(
        enrichUseCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle draft status validation error', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce({
        id: 'ticket-1',
        title: 'Feature A',
        status: 'complete', // Not draft
        workspaceId,
      });

      // Act & Assert
      await expect(
        enrichUseCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing ticket error', async () => {
      // Arrange
      const ticketIds = ['nonexistent'];
      const workspaceId = 'workspace-123';

      mockAecRepository.findById.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        enrichUseCase.execute({
          workspaceId,
          ticketIds,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Finalization Flow', () => {
    it('should finalize multiple tickets successfully', async () => {
      // Arrange
      const answers = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce({
          id: 'ticket-1',
          title: 'Feature A',
          status: 'draft',
        })
        .mockResolvedValueOnce({
          id: 'ticket-2',
          title: 'Feature B',
          status: 'draft',
        });

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Act
      const result = await finalizeUseCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.results.every((r) => r.success)).toBe(true);
    });

    it('should handle partial failure in finalization', async () => {
      // Arrange
      const answers = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
        { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
      ];

      mockAecRepository.findById
        .mockResolvedValueOnce({
          id: 'ticket-1',
          title: 'Feature A',
          status: 'draft',
        })
        .mockResolvedValueOnce({
          id: 'ticket-2',
          title: 'Feature B',
          status: 'draft',
        });

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Spec generation failed'));

      // Act
      const result = await finalizeUseCase.execute({ answers });

      // Assert
      expect(result.completedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });

    it('should handle empty answers error', async () => {
      // Act & Assert
      await expect(
        finalizeUseCase.execute({ answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full enrichment -> finalization flow', async () => {
      // Arrange
      const ticketIds = ['ticket-1', 'ticket-2'];
      const workspaceId = 'workspace-123';
      const progressEvents: any[] = [];

      // Setup for enrichment
      mockAecRepository.findById
        .mockResolvedValueOnce({
          id: 'ticket-1',
          title: 'Feature A',
          status: 'draft',
          workspaceId,
        })
        .mockResolvedValueOnce({
          id: 'ticket-2',
          title: 'Feature B',
          status: 'draft',
          workspaceId,
        });

      mockGenerateQuestionsUseCase.execute
        .mockResolvedValueOnce([
          { id: 'q1', text: 'How many users?', type: 'textarea' },
          { id: 'q2', text: 'What platforms?', type: 'textarea' },
        ])
        .mockResolvedValueOnce([
          { id: 'q3', text: 'Timeline?', type: 'textarea' },
        ]);

      // Act 1: Enrich tickets
      const enrichResult = await enrichUseCase.execute({
        workspaceId,
        ticketIds,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert enrichment
      expect(enrichResult.completedCount).toBe(2);
      expect(enrichResult.questions.get('ticket-1')).toHaveLength(2);
      expect(enrichResult.questions.get('ticket-2')).toHaveLength(1);

      // Act 2: Finalize tickets
      const answers = [
        { ticketId: 'ticket-1', questionId: 'q1', answer: 'Thousands of users' },
        { ticketId: 'ticket-1', questionId: 'q2', answer: 'Web and mobile' },
        { ticketId: 'ticket-2', questionId: 'q3', answer: '3 months' },
      ];

      mockSubmitQuestionAnswersUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const finalizeResult = await finalizeUseCase.execute({ answers });

      // Assert finalization
      expect(finalizeResult.completedCount).toBe(2);
      expect(finalizeResult.failedCount).toBe(0);
    });
  });

  describe('Progress Event Emission', () => {
    it('should emit progress events during enrichment', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';
      const progressEvents: any[] = [];

      mockAecRepository.findById.mockResolvedValueOnce({
        id: 'ticket-1',
        title: 'Feature A',
        status: 'draft',
        workspaceId,
      });

      mockGenerateQuestionsUseCase.execute.mockResolvedValueOnce([
        { id: 'q1', text: 'Question', type: 'textarea' },
      ]);

      // Act
      await enrichUseCase.execute({
        workspaceId,
        ticketIds,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0]).toHaveProperty('agentId');
      expect(progressEvents[0]).toHaveProperty('ticketId');
      expect(progressEvents[0]).toHaveProperty('phase');
      expect(progressEvents[0]).toHaveProperty('status');
    });

    it('should emit error events on failure', async () => {
      // Arrange
      const ticketIds = ['ticket-1'];
      const workspaceId = 'workspace-123';
      const progressEvents: any[] = [];

      mockAecRepository.findById.mockResolvedValueOnce({
        id: 'ticket-1',
        title: 'Feature A',
        status: 'draft',
        workspaceId,
      });

      mockGenerateQuestionsUseCase.execute.mockRejectedValueOnce(
        new Error('LLM error'),
      );

      // Act
      await enrichUseCase.execute({
        workspaceId,
        ticketIds,
        onProgress: (event) => progressEvents.push(event),
      });

      // Assert
      const errorEvents = progressEvents.filter((e) => e.type === 'error');
      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].message).toMatch(/LLM error/);
    });
  });
});
