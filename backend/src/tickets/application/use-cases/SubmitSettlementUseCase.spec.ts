import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SubmitSettlementUseCase } from './SubmitSettlementUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    deliver: jest.fn(),
  };
}

describe('SubmitSettlementUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: SubmitSettlementUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SubmitSettlementUseCase(aecRepository as any);
  });

  it('delivers ticket with settlement payload', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      executionSummary: 'Added rate limiting',
      filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
      divergences: [],
    });

    expect(mockAEC.deliver).toHaveBeenCalledWith({
      executionSummary: 'Added rate limiting',
      filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
      divergences: [],
    });
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, executionSummary: 'x', filesChanged: [], divergences: [] }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, executionSummary: 'x', filesChanged: [], divergences: [] }),
    ).rejects.toThrow(ForbiddenException);
  });
});
