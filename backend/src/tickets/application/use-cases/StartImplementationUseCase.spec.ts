import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { StartImplementationUseCase } from './StartImplementationUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { NotificationService } from '../../../notifications/notification.service';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: {
  status?: AECStatus;
  teamId?: string;
  createdBy?: string;
} = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.APPROVED,
    title: 'Add welcome screen',
    createdBy: overrides.createdBy ?? 'creator-user-1',
    startImplementation: jest.fn(),
  };
}

describe('StartImplementationUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let mockNotificationService: jest.Mocked<NotificationService>;
  let useCase: StartImplementationUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationService = {
      notifyTicketAssigned: jest.fn().mockResolvedValue(undefined),
      notifyTicketReady: jest.fn().mockResolvedValue(undefined),
      notifyTicketReadyForReview: jest.fn().mockResolvedValue(undefined),
      notifyImplementationStarted: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new StartImplementationUseCase(aecRepository as any, mockNotificationService);
  });

  it('calls startImplementation on AEC and saves', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(mockAEC.startImplementation).toHaveBeenCalledWith('forge/welcome-screen', undefined);
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
    expect(result.branchName).toBe('forge/welcome-screen');
  });

  it('sends notification to ticket creator', async () => {
    const mockAEC = makeMockAEC({ createdBy: 'pm-user-42' });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(mockNotificationService.notifyImplementationStarted).toHaveBeenCalledWith(
      TICKET_ID,
      'pm-user-42',
      'Add welcome screen',
    );
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when domain rejects transition', async () => {
    const mockAEC = makeMockAEC();
    mockAEC.startImplementation.mockImplementation(() => {
      throw new InvalidStateTransitionError('Cannot start implementation from draft');
    });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('still succeeds if notification fails', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);
    mockNotificationService.notifyImplementationStarted.mockRejectedValue(new Error('email down'));

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(result.success).toBe(true);
  });
});
