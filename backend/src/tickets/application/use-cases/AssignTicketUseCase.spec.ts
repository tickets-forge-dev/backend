import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssignTicketUseCase } from './AssignTicketUseCase';
import { AECRepository } from '../ports/AECRepository';
import { TeamMemberRepository } from '../../../teams/application/ports/TeamMemberRepository';
import { AEC } from '../../domain/aec/AEC';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { TeamMember } from '../../../teams/domain/TeamMember';
import { Role } from '../../../teams/domain/Role';
import { MemberStatus } from '../../../teams/domain/MemberStatus';

describe('AssignTicketUseCase', () => {
  let useCase: AssignTicketUseCase;
  let mockAecRepository: jest.Mocked<AECRepository>;
  let mockTeamMemberRepository: jest.Mocked<TeamMemberRepository>;

  beforeEach(() => {
    mockAecRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByWorkspace: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockTeamMemberRepository = {
      save: jest.fn(),
      update: jest.fn(),
      findByTeam: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      findByUserAndTeam: jest.fn(),
      delete: jest.fn(),
    } as any;

    useCase = new AssignTicketUseCase(mockAecRepository, mockTeamMemberRepository);
  });

  // Helper to create mock team members
  const createMockMember = (userId: string, teamId: string, role: Role, status: MemberStatus = MemberStatus.ACTIVE) => {
    // Generate valid email: if userId already contains @, use it as-is, otherwise append @example.com
    const email = userId.includes('@') ? userId : `${userId.replace(/[^a-zA-Z0-9]/g, '-')}@example.com`;

    return TeamMember.reconstitute({
      id: `${teamId}_${userId}`,
      userId,
      teamId,
      email,
      role,
      status,
    });
  };

  // Helper to setup valid authorization mocks (PM requesting, Dev being assigned)
  const setupValidAuthMocks = (requestingUserId: string, assignedUserId: string, workspaceId: string) => {
    const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);
    const assignedDev = createMockMember(assignedUserId, workspaceId, Role.DEVELOPER);
    mockTeamMemberRepository.findByUserAndTeam
      .mockResolvedValueOnce(requestingPM)
      .mockResolvedValueOnce(assignedDev);
  };

  // Helper for unassign: only needs requesting user validation
  const setupUnassignAuthMocks = (requestingUserId: string, workspaceId: string) => {
    const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(requestingPM);
  };

  describe('Happy Path - Assign Ticket', () => {
    it('should assign ticket to user (PM assigning Developer)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket', 'Description');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then
      expect(mockAecRepository.findById).toHaveBeenCalledWith(ticketId);
      expect(mockTeamMemberRepository.findByUserAndTeam).toHaveBeenCalledWith(requestingUserId, workspaceId);
      expect(mockTeamMemberRepository.findByUserAndTeam).toHaveBeenCalledWith(userId, workspaceId);
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
      expect(mockAec.assignedTo).toBe(userId);
    });

    it('should accept userId with leading/trailing whitespace', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = '  user-456  '; // With whitespace
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: Should succeed (userId accepted as-is, trimming is caller's responsibility)
      expect(mockAec.assignedTo).toBe(userId);
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Happy Path - Unassign Ticket', () => {
    it('should unassign ticket when userId is null', async () => {
      // Given
      const ticketId = 'aec_123';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(
        workspaceId,
        requestingUserId,
        'Test Ticket',
        'Description',
        undefined,
        undefined,
        undefined,
        'previous-user-456', // Previously assigned
      );

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupUnassignAuthMocks(requestingUserId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId: null, requestingUserId, workspaceId });

      // Then
      expect(mockAec.assignedTo).toBeNull();
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should unassign ticket even if already unassigned', async () => {
      // Given
      const ticketId = 'aec_123';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupUnassignAuthMocks(requestingUserId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId: null, requestingUserId, workspaceId });

      // Then: Should succeed (idempotent)
      expect(mockAec.assignedTo).toBeNull();
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authorization - Role-Based Access Control', () => {
    it('should allow PM to assign tickets', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'dev-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: Should succeed
      expect(mockAec.assignedTo).toBe(userId);
    });

    it('should allow Admin to assign tickets', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'dev-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'admin-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingAdmin = createMockMember(requestingUserId, workspaceId, Role.ADMIN);
      const assignedDev = createMockMember(userId, workspaceId, Role.DEVELOPER);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(requestingAdmin)
        .mockResolvedValueOnce(assignedDev);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: Should succeed
      expect(mockAec.assignedTo).toBe(userId);
    });

    it('should reject if requesting user is Developer (not PM/Admin)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'dev-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'dev-789';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingDev = createMockMember(requestingUserId, workspaceId, Role.DEVELOPER);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(requestingDev);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Only Admins and PMs can assign tickets');

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });

    it('should reject if requesting user is QA (not PM/Admin)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'dev-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'qa-789';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingQA = createMockMember(requestingUserId, workspaceId, Role.QA);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(requestingQA);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Only Admins and PMs can assign tickets');

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });

    it('should reject assigning to non-developer (PM)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'pm-other';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);
      const targetPM = createMockMember(userId, workspaceId, Role.PM);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(requestingPM)
        .mockResolvedValueOnce(targetPM);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Can only assign tickets to developers');
    });

    it('should reject assigning to QA', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'qa-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);
      const targetQA = createMockMember(userId, workspaceId, Role.QA);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(requestingPM)
        .mockResolvedValueOnce(targetQA);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Can only assign tickets to developers');
    });

    it('should reject assigning to inactive developer', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'dev-removed';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);
      const inactiveDev = createMockMember(userId, workspaceId, Role.DEVELOPER, MemberStatus.REMOVED);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(requestingPM)
        .mockResolvedValueOnce(inactiveDev);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Cannot assign tickets to inactive team members');
    });

    it('should reject assigning to non-member', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'external-dev';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce(requestingPM)
        .mockResolvedValueOnce(null); // Target user not found

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('is not a member of this team');
    });
  });

  describe('Authorization - Workspace Isolation', () => {
    it('should reject if ticket does not belong to workspace', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const ticketWorkspaceId = 'workspace-DIFFERENT';
      const requestingWorkspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(ticketWorkspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId: requestingWorkspaceId })
      ).rejects.toThrow(ForbiddenException);

      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId: requestingWorkspaceId })
      ).rejects.toThrow('Ticket does not belong to your workspace');

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Validation - Input Validation', () => {
    it('should reject empty userId string', async () => {
      // Given
      const ticketId = 'aec_123';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValue(requestingPM);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId: '', requestingUserId, workspaceId })
      ).rejects.toThrow('userId cannot be empty');

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only userId', async () => {
      // Given
      const ticketId = 'aec_123';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const requestingPM = createMockMember(requestingUserId, workspaceId, Role.PM);

      mockAecRepository.findById.mockResolvedValue(mockAec);
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce(requestingPM);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId: '   ', requestingUserId, workspaceId })
      ).rejects.toThrow(BadRequestException);

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Error Cases', () => {
    it('should throw NotFoundException if ticket not found', async () => {
      // Given
      const ticketId = 'nonexistent-aec';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      mockAecRepository.findById.mockResolvedValue(null);

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow(NotFoundException);

      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow(`Ticket ${ticketId} not found`);

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // When/Then
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('Edge Cases', () => {
    it('should allow reassigning to same user (idempotent)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(
        workspaceId,
        requestingUserId,
        'Test Ticket',
        'Description',
        undefined,
        undefined,
        undefined,
        userId, // Already assigned to same user
      );

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: Should succeed (idempotent)
      expect(mockAec.assignedTo).toBe(userId);
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should allow reassigning from one user to another', async () => {
      // Given
      const ticketId = 'aec_123';
      const oldUserId = 'user-456';
      const newUserId = 'user-789';
      const workspaceId = 'workspace-123';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(
        workspaceId,
        requestingUserId,
        'Test Ticket',
        'Description',
        undefined,
        undefined,
        undefined,
        oldUserId, // Previously assigned
      );

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, newUserId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId: newUserId, requestingUserId, workspaceId });

      // Then
      expect(mockAec.assignedTo).toBe(newUserId);
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in userId', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456@firebase.com'; // Special characters
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: Should succeed (userId not validated for format)
      expect(mockAec.assignedTo).toBe(userId);
      expect(mockAecRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Domain Integration - AEC State Transitions', () => {
    it('should allow assignment on draft ticket', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then
      expect(mockAec.status).toBe(AECStatus.DRAFT);
      expect(mockAec.assignedTo).toBe(userId);
    });

    it('should reject assignment on complete ticket (domain rule)', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      mockAec.markComplete(); // Mark as complete

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);

      // When/Then: Domain enforces: cannot assign completed tickets
      await expect(
        useCase.execute({ ticketId, userId, requestingUserId, workspaceId })
      ).rejects.toThrow('Cannot assign a completed ticket. Revert to draft first.');

      expect(mockAecRepository.save).not.toHaveBeenCalled();
    });

    it('should update updatedAt timestamp on assignment', async () => {
      // Given
      const ticketId = 'aec_123';
      const userId = 'user-456';
      const workspaceId = 'workspace-789';
      const requestingUserId = 'pm-user-123';

      const mockAec = AEC.createDraft(workspaceId, requestingUserId, 'Test Ticket');
      const originalUpdatedAt = mockAec.updatedAt;

      // Wait a tiny bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      mockAecRepository.findById.mockResolvedValue(mockAec);
      setupValidAuthMocks(requestingUserId, userId, workspaceId);
      mockAecRepository.save.mockResolvedValue(undefined);

      // When
      await useCase.execute({ ticketId, userId, requestingUserId, workspaceId });

      // Then: updatedAt should change
      expect(mockAec.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
