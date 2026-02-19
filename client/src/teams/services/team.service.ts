import { getAuth } from 'firebase/auth';

/**
 * TeamService - Frontend API Client
 *
 * Handles all team-related API calls.
 * Uses Firebase Auth for authentication.
 */

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings: {
    defaultWorkspaceId?: string;
    allowMemberInvites: boolean;
  };
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
  isCurrent: boolean;
}

export interface CreateTeamRequest {
  name: string;
  allowMemberInvites?: boolean;
}

export interface UpdateTeamRequest {
  name?: string;
  settings?: {
    defaultWorkspaceId?: string;
    allowMemberInvites?: boolean;
  };
}

export interface SwitchTeamRequest {
  teamId: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'developer' | 'pm' | 'qa';
  status: 'active' | 'invited' | 'removed';
  invitedBy: string;
  invitedAt: string;
  joinedAt?: string;
  removedAt?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'developer' | 'pm' | 'qa';
}

export interface ChangeMemberRoleRequest {
  role: 'developer' | 'pm' | 'qa';
}

class TeamService {
  private baseUrl: string;

  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    // Allow undefined during SSG/build time - will validate on first use
    this.baseUrl = apiUrl ? `${apiUrl}/teams` : '';
  }

  /**
   * Validate API URL is configured (lazy validation for SSG compatibility)
   */
  private validateApiUrl(): void {
    if (!this.baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
    }
  }

  /**
   * Get authentication token from Firebase
   */
  private async getAuthToken(): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }

  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<Team> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create team');
    }

    const data = await response.json();
    return data.team;
  }

  /**
   * Get all teams for current user
   */
  async getUserTeams(): Promise<{ teams: TeamSummary[]; currentTeamId: string | null }> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    return await response.json();
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team');
    }

    const data = await response.json();
    return data.team;
  }

  /**
   * Update team
   */
  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update team');
    }

    const data = await response.json();
    return data.team;
  }

  /**
   * Switch current team
   */
  async switchTeam(request: SwitchTeamRequest): Promise<{ currentTeamId: string; teamName: string }> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to switch team');
    }

    const data = await response.json();
    return data.currentTeam;
  }

  /**
   * Delete team (soft delete)
   */
  async deleteTeam(teamId: string): Promise<void> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete team');
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}/members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch team members');
    }

    const data = await response.json();
    return data.members;
  }

  /**
   * Invite a new member to the team
   */
  async inviteMember(teamId: string, request: InviteMemberRequest): Promise<void> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to invite member');
    }
  }

  /**
   * Change member role
   */
  async changeMemberRole(
    teamId: string,
    userId: string,
    request: ChangeMemberRoleRequest,
  ): Promise<void> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}/members/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change member role');
    }
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    this.validateApiUrl();
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove member');
    }
  }
}

// Singleton instance
export const teamService = new TeamService();
