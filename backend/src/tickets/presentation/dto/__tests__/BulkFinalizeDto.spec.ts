/**
 * Unit Tests for BulkFinalizeDto Validation
 *
 * Tests finalization request DTO validation including:
 * - Answer length constraints
 * - Array size constraints
 * - Nested object validation
 */

import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BulkFinalizeDto } from '../BulkFinalizeDto';

describe('BulkFinalizeDto', () => {
  describe('answers array validation', () => {
    it('should accept valid answers array', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: 'Answer 1' },
          { ticketId: 'ticket-2', questionId: 'q2', answer: 'Answer 2' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should reject empty answers array', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const arrayMinError = errors.find((e) => e.constraints?.['arrayMinSize']);
      expect(arrayMinError?.constraints?.['arrayMinSize']).toContain('At least one answer is required');
    });

    it('should reject answers array with more than 500 items', async () => {
      // Arrange
      const answers = Array.from({ length: 501 }, (_, i) => ({
        ticketId: `ticket-${(i % 10) + 1}`,
        questionId: `q${i + 1}`,
        answer: `Answer ${i + 1}`,
      }));

      const dto = plainToInstance(BulkFinalizeDto, { answers });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const arrayMaxError = errors.find((e) => e.constraints?.['arrayMaxSize']);
      expect(arrayMaxError?.constraints?.['arrayMaxSize']).toContain(
        'Cannot finalize more than 500 answers at a time',
      );
    });

    it('should accept exactly 500 answers', async () => {
      // Arrange
      const answers = Array.from({ length: 500 }, (_, i) => ({
        ticketId: `ticket-${(i % 10) + 1}`,
        questionId: `q${i + 1}`,
        answer: `Answer ${i + 1}`,
      }));

      const dto = plainToInstance(BulkFinalizeDto, { answers });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('answer length validation', () => {
    it('should accept answers up to 5000 characters', async () => {
      // Arrange
      const longAnswer = 'A'.repeat(5000);
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: longAnswer },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should reject answers longer than 5000 characters', async () => {
      // Arrange
      const tooLongAnswer = 'A'.repeat(5001);
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: tooLongAnswer },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      // Check for nested validation errors in children
      const answersError = errors.find((e) => e.property === 'answers');
      expect(answersError?.children?.length || 0).toBeGreaterThan(0);
      const answerItemError = answersError?.children?.[0];
      expect(answerItemError?.children?.some((child: any) =>
        child.constraints?.['maxLength']?.includes('5000')
      )).toBe(true);
    });

    it('should accept empty answers (edge case)', async () => {
      // Arrange: Empty string is technically valid (max length constraint passes)
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: '' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      // Note: @IsNotEmpty would catch this, but only @MaxLength is on answer field
      expect(errors.filter((e) => e.property === 'answer')).toHaveLength(0);
    });
  });

  describe('ticketId validation', () => {
    it('should reject missing ticketId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { questionId: 'q1', answer: 'Answer' } as any,
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject empty ticketId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: '', questionId: 'q1', answer: 'Answer' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid ticketId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-123-abc', questionId: 'q1', answer: 'Answer' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('questionId validation', () => {
    it('should reject missing questionId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', answer: 'Answer' } as any,
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject empty questionId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: '', answer: 'Answer' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid questionId', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q-uuid-123', answer: 'Answer' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle mixed valid and invalid answers', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: 'Valid answer' },
          { ticketId: 'ticket-2', questionId: '', answer: 'Missing question ID' },
          { ticketId: '', questionId: 'q3', answer: 'Missing ticket ID' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle single answer', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          { ticketId: 'ticket-1', questionId: 'q1', answer: 'Single answer' },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle special characters in answers', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          {
            ticketId: 'ticket-1',
            questionId: 'q1',
            answer: 'Answer with special chars: @#$%^&*()_+-=[]{}|;:",.<>?/',
          },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters in answers', async () => {
      // Arrange
      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          {
            ticketId: 'ticket-1',
            questionId: 'q1',
            answer: 'Answer with unicode: 你好 مرحبا שלום',
          },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle newlines and whitespace in answers', async () => {
      // Arrange
      const multilineAnswer = `Line 1
Line 2
Line 3`;

      const dto = plainToInstance(BulkFinalizeDto, {
        answers: [
          {
            ticketId: 'ticket-1',
            questionId: 'q1',
            answer: multilineAnswer,
          },
        ],
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });
});
