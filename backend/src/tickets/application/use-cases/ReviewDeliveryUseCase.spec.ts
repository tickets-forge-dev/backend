import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReviewDeliveryUseCase } from './ReviewDeliveryUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: { status?: AECStatus; teamId?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.DELIVERED,
    acceptDelivery: jest.fn(),
    requestChanges: jest.fn(),
  };
}

describe('ReviewDeliveryUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let useCase: ReviewDeliveryUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReviewDeliveryUseCase(aecRepository as any);
  });

  it('accepts delivery', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      action: 'accept',
    });

    expect(mockAEC.acceptDelivery).toHaveBeenCalledTimes(1);
    expect(mockAEC.requestChanges).not.toHaveBeenCalled();
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
  });

  it('requests changes with note', async () => {
    const mockAEC = makeMockAEC({});
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      action: 'request_changes',
      note: 'Use sliding window as specified',
    });

    expect(mockAEC.requestChanges).toHaveBeenCalledWith('Use sliding window as specified');
    expect(mockAEC.acceptDelivery).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, action: 'accept' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, action: 'accept' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
