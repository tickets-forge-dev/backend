import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReEnrichWithQAUseCase } from './ReEnrichWithQAUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import type { TechSpec } from '../../domain/tech-spec/TechSpecGenerator';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEAM_ID = 'team_abc123';
const TICKET_ID = 'aec_001';

const mockQAItems = [
  { question: 'What rate limit threshold?', answer: '5 per minute per IP' },
  { question: 'Which endpoint needs limiting?', answer: 'POST /auth/login only' },
];

const mockTechSpec: TechSpec = {
  problemStatement: { summary: 'Rate limiting needed', context: 'Brute force risk' },
  solution: {
    overview: 'Add rate limit middleware',
    approach: 'Use express-rate-limit',
    architectureNotes: '',
    implementationSteps: [],
  },
  acceptanceCriteria: [
    { given: 'a user submits 5 login attempts', when: 'a 6th attempt is made', then: 'a 429 is returned' },
    { given: 'the rate limit window expires', when: 'a new attempt is made', then: 'the request succeeds' },
  ],
  fileChanges: [],
  apiEndpoints: [],
  dependencies: [],
  testPlan: { unitTests: [], integrationTests: [], e2eTests: [] },
  stack: { primary: 'Node.js', framework: 'NestJS', language: 'TypeScript', testing: 'jest', database: null },
  qualityScore: 85,
  visualExpectations: undefined,
} as unknown as TechSpec;

function makeMockAEC(overrides: {
  status?: AECStatus;
  teamId?: string;
  reviewSession?: { qaItems: typeof mockQAItems; submittedAt: Date } | null;
  repositoryContext?: null;
}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.WAITING_FOR_APPROVAL,
    title: 'Add login rate limiting',
    description: 'Prevent brute force attacks',
    reviewSession: overrides.reviewSession !== undefined
      ? overrides.reviewSession
      : { qaItems: mockQAItems, submittedAt: new Date() },
    repositoryContext: overrides.repositoryContext !== undefined ? overrides.repositoryContext : null,
    taskAnalysis: undefined,
    reEnrichFromQA: jest.fn(),
  };
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('ReEnrichWithQAUseCase', () => {
  let aecRepository: jest.Mocked<{ findById: jest.Mock; save: jest.Mock }>;
  let techSpecGenerator: jest.Mocked<{ generateWithAnswers: jest.Mock }>;
  let codebaseAnalyzer: jest.Mocked<{ analyzeStructure: jest.Mock }>;
  let stackDetector: jest.Mocked<{ detectStack: jest.Mock }>;
  let githubFileService: jest.Mocked<{ getTree: jest.Mock; readFile: jest.Mock }>;
  let useCase: ReEnrichWithQAUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    techSpecGenerator = {
      generateWithAnswers: jest.fn().mockResolvedValue(mockTechSpec),
    };
    codebaseAnalyzer = {
      analyzeStructure: jest.fn(),
    };
    stackDetector = {
      detectStack: jest.fn(),
    };
    githubFileService = {
      getTree: jest.fn(),
      readFile: jest.fn(),
    };

    useCase = new ReEnrichWithQAUseCase(
      aecRepository as any,
      techSpecGenerator as any,
      codebaseAnalyzer as any,
      stackDetector as any,
      githubFileService as any,
    );
  });

  // ── Happy path ────────────────────────────────────────────────────────────────

  describe('Happy Path', () => {
    it('calls generateWithAnswers with Q&A mapped as AnswerContext and returns updated AEC', async () => {
      const mockAEC = makeMockAEC({});
      aecRepository.findById.mockResolvedValue(mockAEC);

      const result = await useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID });

      // Q&A mapping: question text used as questionId
      expect(techSpecGenerator.generateWithAnswers).toHaveBeenCalledWith({
        title: 'Add login rate limiting',
        description: 'Prevent brute force attacks',
        context: expect.objectContaining({ stack: expect.any(Object) }),
        answers: [
          { questionId: 'What rate limit threshold?', answer: '5 per minute per IP' },
          { questionId: 'Which endpoint needs limiting?', answer: 'POST /auth/login only' },
        ],
      });

      // Domain method called with generated spec
      expect(mockAEC.reEnrichFromQA).toHaveBeenCalledWith(mockTechSpec);

      // Persisted
      expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);

      // Returns the AEC entity
      expect(result).toBe(mockAEC);
    });

    it('status remains WAITING_FOR_APPROVAL — use case does not change status directly', async () => {
      const mockAEC = makeMockAEC({});
      aecRepository.findById.mockResolvedValue(mockAEC);

      await useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID });

      // reEnrichFromQA was called once (domain method responsible for not changing status)
      expect(mockAEC.reEnrichFromQA).toHaveBeenCalledTimes(1);
      // Status not mutated at use case level
      expect(mockAEC.status).toBe(AECStatus.WAITING_FOR_APPROVAL);
    });

    it('passes minimal context when ticket has no repositoryContext', async () => {
      const mockAEC = makeMockAEC({ repositoryContext: null });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID });

      // GitHub services NOT called when no repo
      expect(githubFileService.getTree).not.toHaveBeenCalled();
      expect(githubFileService.readFile).not.toHaveBeenCalled();
      expect(stackDetector.detectStack).not.toHaveBeenCalled();

      // generateWithAnswers still called with minimal context
      expect(techSpecGenerator.generateWithAnswers).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            files: expect.any(Map),
          }),
        }),
      );
    });
  });

  // ── Error: ticket not found ────────────────────────────────────────────────────

  describe('Error Cases — Ticket Not Found', () => {
    it('throws NotFoundException when ticket does not exist', async () => {
      aecRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ ticketId: 'aec_nonexistent', teamId: TEAM_ID }),
      ).rejects.toThrow(NotFoundException);

      expect(techSpecGenerator.generateWithAnswers).not.toHaveBeenCalled();
    });
  });

  // ── Error: team ownership ─────────────────────────────────────────────────────

  describe('Error Cases — Team Ownership', () => {
    it('throws ForbiddenException when ticket belongs to a different team', async () => {
      const mockAEC = makeMockAEC({ teamId: 'team_other' });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).rejects.toThrow(ForbiddenException);

      expect(techSpecGenerator.generateWithAnswers).not.toHaveBeenCalled();
    });
  });

  // ── Error: missing review session ─────────────────────────────────────────────

  describe('Error Cases — Review Session Validation', () => {
    it('throws BadRequestException when ticket has no reviewSession', async () => {
      const mockAEC = makeMockAEC({ reviewSession: null });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).rejects.toThrow(BadRequestException);

      expect(techSpecGenerator.generateWithAnswers).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when reviewSession.qaItems is empty', async () => {
      const mockAEC = makeMockAEC({
        reviewSession: { qaItems: [], submittedAt: new Date() },
      });
      aecRepository.findById.mockResolvedValue(mockAEC);

      await expect(
        useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID }),
      ).rejects.toThrow(BadRequestException);

      expect(techSpecGenerator.generateWithAnswers).not.toHaveBeenCalled();
    });
  });
});
