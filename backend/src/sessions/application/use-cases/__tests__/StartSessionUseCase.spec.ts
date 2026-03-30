import { StartSessionUseCase } from '../StartSessionUseCase';
import { Session } from '../../../domain/Session';
import { SessionStatus } from '../../../domain/SessionStatus';
import { UsageQuota } from '../../../../billing/domain/UsageQuota';

describe('StartSessionUseCase', () => {
  const mockSessionRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findActiveByTicket: jest.fn().mockResolvedValue(null),
    findActiveByUser: jest.fn().mockResolvedValue([]),
  };

  const mockQuotaRepo = {
    getOrCreate: jest.fn().mockResolvedValue(
      UsageQuota.createForPlan('team-1', '2026-03', 'pro'),
    ),
    save: jest.fn(),
  };

  const mockAecEntity = {
    id: 'aec-123',
    teamId: 'team-1',
    status: 'approved',
    title: 'Add webhook retry',
    repositoryContext: null,
    startImplementation: jest.fn(),
  };

  const mockAecRepo = {
    findById: jest.fn().mockResolvedValue(mockAecEntity),
    save: jest.fn(),
  };

  let useCase: StartSessionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mocks after clearAllMocks
    mockSessionRepo.findActiveByTicket.mockResolvedValue(null);
    mockSessionRepo.findActiveByUser.mockResolvedValue([]);
    mockQuotaRepo.getOrCreate.mockResolvedValue(
      UsageQuota.createForPlan('team-1', '2026-03', 'pro'),
    );
    mockAecEntity.startImplementation.mockReset();
    mockAecRepo.findById.mockResolvedValue(mockAecEntity);
    useCase = new StartSessionUseCase(
      mockSessionRepo as any,
      mockQuotaRepo as any,
      mockAecRepo as any,
    );
  });

  it('should create a session for an approved ticket', async () => {
    const result = await useCase.execute({
      ticketId: 'aec-123',
      userId: 'user-1',
      teamId: 'team-1',
    });

    expect(result.sessionId).toMatch(/^session_/);
    expect(mockSessionRepo.save).toHaveBeenCalledTimes(1);
    const savedSession = mockSessionRepo.save.mock.calls[0][0] as Session;
    expect(savedSession.status).toBe(SessionStatus.PROVISIONING);
    expect(savedSession.ticketId).toBe('aec-123');
  });

  it('should throw NotFoundException if ticket not found', async () => {
    mockAecRepo.findById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        ticketId: 'aec-999',
        userId: 'user-1',
        teamId: 'team-1',
      }),
    ).rejects.toThrow(/not found/i);
  });

  it('should throw ForbiddenException if ticket belongs to different team', async () => {
    mockAecRepo.findById.mockResolvedValueOnce({
      id: 'aec-123',
      teamId: 'other-team',
      status: 'approved',
      title: 'Test',
      repositoryContext: null,
      startImplementation: jest.fn(),
    });

    await expect(
      useCase.execute({
        ticketId: 'aec-123',
        userId: 'user-1',
        teamId: 'team-1',
      }),
    ).rejects.toThrow(/team/i);
  });

  it('should throw ConflictException if ticket is not approved', async () => {
    mockAecRepo.findById.mockResolvedValueOnce({
      id: 'aec-123',
      teamId: 'team-1',
      status: 'draft',
      title: 'Test',
      repositoryContext: null,
      startImplementation: jest.fn(),
    });

    await expect(
      useCase.execute({
        ticketId: 'aec-123',
        userId: 'user-1',
        teamId: 'team-1',
      }),
    ).rejects.toThrow(/approved/i);
  });

  it('should throw ForbiddenException if quota is exhausted', async () => {
    const exhaustedQuota = UsageQuota.createDefault('team-1', '2026-03');
    exhaustedQuota.deduct();
    exhaustedQuota.deduct();
    mockQuotaRepo.getOrCreate.mockResolvedValueOnce(exhaustedQuota);

    await expect(
      useCase.execute({
        ticketId: 'aec-123',
        userId: 'user-1',
        teamId: 'team-1',
      }),
    ).rejects.toThrow(/quota/i);
  });

  it('should transition ticket to EXECUTING status', async () => {
    await useCase.execute({ ticketId: 'aec-123', userId: 'user-1', teamId: 'team-1' });

    expect(mockAecEntity.startImplementation).toHaveBeenCalledTimes(1);
    expect(mockAecEntity.startImplementation).toHaveBeenCalledWith(
      expect.stringContaining('aec-123'),
    );
    expect(mockAecRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException if ticket already has active session', async () => {
    mockSessionRepo.findActiveByTicket.mockResolvedValueOnce(
      Session.createNew({
        ticketId: 'aec-123',
        teamId: 'team-1',
        userId: 'user-1',
        ticketTitle: 'Test',
        repoOwner: 'acme',
        repoName: 'api',
        branch: 'feat/test',
      }),
    );

    await expect(
      useCase.execute({
        ticketId: 'aec-123',
        userId: 'user-1',
        teamId: 'team-1',
      }),
    ).rejects.toThrow(/active session/i);
  });
});
