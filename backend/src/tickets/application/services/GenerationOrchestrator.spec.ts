import { GenerationOrchestrator } from './GenerationOrchestrator';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository } from '../ports/AECRepository';
import { ILLMContentGenerator } from '../../../shared/application/ports/ILLMContentGenerator';
import { GenerationStateFactory } from '../../domain/value-objects/GenerationState';

describe('GenerationOrchestrator', () => {
  let orchestrator: GenerationOrchestrator;
  let mockAecRepository: jest.Mocked<AECRepository>;
  let mockLlmGenerator: jest.Mocked<ILLMContentGenerator>;
  let testAec: AEC;

  beforeEach(() => {
    // Create mocks
    mockAecRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByWorkspace: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<AECRepository>;

    mockLlmGenerator = {
      extractIntent: jest.fn(),
      detectType: jest.fn(),
      generateDraft: jest.fn(),
      generateQuestions: jest.fn(),
    } as jest.Mocked<ILLMContentGenerator>;

    orchestrator = new GenerationOrchestrator(mockAecRepository, mockLlmGenerator);

    // Create test AEC
    testAec = AEC.createDraft('ws_test', 'Test Ticket', 'Test description');
  });

  describe('orchestrate', () => {
    it('should execute all 8 steps sequentially', async () => {
      // Setup mocks
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'Add authentication',
        keywords: ['auth', 'login'],
      });
      
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });

      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: ['Users can log in', 'Session persists'],
        assumptions: ['Using Firebase Auth'],
        repoPaths: ['src/auth'],
      });

      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });

      mockAecRepository.update.mockResolvedValue();

      // Execute
      await orchestrator.orchestrate(testAec);

      // Verify all LLM steps called
      expect(mockLlmGenerator.extractIntent).toHaveBeenCalledWith({
        title: 'Test Ticket',
        description: 'Test description',
      });
      expect(mockLlmGenerator.detectType).toHaveBeenCalled();
      expect(mockLlmGenerator.generateDraft).toHaveBeenCalled();
      expect(mockLlmGenerator.generateQuestions).toHaveBeenCalled();

      // Verify Firestore updates after each step
      // Each step calls update twice: once for in-progress, once for complete
      // 8 steps × 2 = 16, plus 1 initial = 17, plus 1 final = 18
      expect(mockAecRepository.update).toHaveBeenCalledTimes(18);

      // Verify final AEC state
      expect(testAec.status).toBe('validated');
      expect(testAec.acceptanceCriteria).toEqual(['Users can log in', 'Session persists']);
    });

    it('should update generationState after each step', async () => {
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'test',
        keywords: [],
      });
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });
      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: [],
        assumptions: [],
        repoPaths: [],
      });
      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });
      mockAecRepository.update.mockResolvedValue();

      await orchestrator.orchestrate(testAec);

      // Check that all steps ended up as 'complete'
      const finalState = testAec.generationState;
      expect(finalState.steps.every((s) => s.status === 'complete')).toBe(true);
    });

    it('should handle step failure and mark step as failed', async () => {
      // Step 1 succeeds
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'test',
        keywords: [],
      });

      // Step 2 fails
      mockLlmGenerator.detectType.mockRejectedValue(new Error('LLM timeout'));

      mockAecRepository.update.mockResolvedValue();

      // Execute and expect failure
      await expect(orchestrator.orchestrate(testAec)).rejects.toThrow('LLM timeout');

      // Verify step 2 marked as failed
      const step2 = testAec.generationState.steps[1];
      expect(step2.status).toBe('failed');
      expect(step2.error).toBe('LLM timeout');

      // Verify state was persisted
      expect(mockAecRepository.update).toHaveBeenCalled();
    });

    it('should timeout steps after 30 seconds', async () => {
      // Mock a step that takes longer than timeout
      mockLlmGenerator.extractIntent.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ intent: 'test', keywords: [] }), 35000);
          }),
      );

      mockAecRepository.update.mockResolvedValue();

      // Execute and expect timeout
      await expect(orchestrator.orchestrate(testAec)).rejects.toThrow();

      // Verify step marked as failed with timeout message
      const step1 = testAec.generationState.steps[0];
      expect(step1.status).toBe('failed');
      expect(step1.error).toContain('timed out');
    }, 35000); // Increase Jest timeout for this test

    it('should store step details on success', async () => {
      const intentResult = { intent: 'Add feature', keywords: ['feature'] };
      mockLlmGenerator.extractIntent.mockResolvedValue(intentResult);
      
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });
      
      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: [],
        assumptions: [],
        repoPaths: [],
      });
      
      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });

      mockAecRepository.update.mockResolvedValue();

      await orchestrator.orchestrate(testAec);

      // Verify step 1 has details
      const step1 = testAec.generationState.steps[0];
      expect(step1.details).toBeDefined();
      expect(step1.details).toContain('Add feature');
    });
  });

  describe('stub implementations', () => {
    it('should execute repo query stub without errors', async () => {
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'test',
        keywords: [],
      });
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });
      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: [],
        assumptions: [],
        repoPaths: [],
      });
      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });
      mockAecRepository.update.mockResolvedValue();

      await orchestrator.orchestrate(testAec);

      // Verify step 3 (repo query) completed
      const step3 = testAec.generationState.steps[2];
      expect(step3.status).toBe('complete');
    });

    it('should execute validation stub and return placeholder score', async () => {
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'test',
        keywords: [],
      });
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });
      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: [],
        assumptions: [],
        repoPaths: [],
      });
      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });
      mockAecRepository.update.mockResolvedValue();

      await orchestrator.orchestrate(testAec);

      // Verify AEC has readiness score (from validation stub)
      expect(testAec.readinessScore).toBeGreaterThan(0);
    });

    it('should execute estimation stub and set estimate', async () => {
      mockLlmGenerator.extractIntent.mockResolvedValue({
        intent: 'test',
        keywords: [],
      });
      mockLlmGenerator.detectType.mockResolvedValue({
        type: 'feature',
        confidence: 0.9,
      });
      mockLlmGenerator.generateDraft.mockResolvedValue({
        acceptanceCriteria: [],
        assumptions: [],
        repoPaths: [],
      });
      mockLlmGenerator.generateQuestions.mockResolvedValue({
        questions: [],
      });
      mockAecRepository.update.mockResolvedValue();

      await orchestrator.orchestrate(testAec);

      // Verify estimate was set
      expect(testAec.estimate).toBeDefined();
      expect(testAec.estimate?.min).toBe(4);
      expect(testAec.estimate?.max).toBe(8);
    });
  });
});
