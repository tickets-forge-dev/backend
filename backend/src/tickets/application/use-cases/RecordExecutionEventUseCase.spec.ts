import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecordExecutionEventUseCase } from './RecordExecutionEventUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    recordExecutionEvent: jest.fn().mockReturnValue({ id: 'evt_1', type: 'decision' }),
  };
}

describe('RecordExecutionEventUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: RecordExecutionEventUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RecordExecutionEventUseCase(aecRepository as any);
  });

  it('records event and saves', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      type: 'decision',
      title: 'Used token bucket',
      description: 'Better burst handling',
    });

    expect(mockAEC.recordExecutionEvent).toHaveBeenCalledWith({
      type: 'decision',
      title: 'Used token bucket',
      description: 'Better burst handling',
    });
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
    expect(result.eventId).toBe('evt_1');
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'aec_xxx', teamId: TEAM_ID, type: 'risk', title: 't', description: 'd' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other_team' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, type: 'risk', title: 't', description: 'd' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
