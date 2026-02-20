/**
 * Team Service
 * Handles team-related API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    defaultWorkspaceId?: string;
    allowMemberInvites: boolean;
  };
}

export interface CreateTeamRequest {
  name: string;
  allowMemberInvites?: boolean;
}

export interface CreateTeamResponse {
  success: boolean;
  team: Team;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'pm' | 'developer' | 'qa';
  status: 'active' | 'invited' | 'removed';
  invitedBy: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  removedAt: string | null;
}

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest, idToken: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create team');
    }

    const data: CreateTeamResponse = await response.json();
    return data.team;
  }

  /**
   * Get all teams for current user
   */
  async getUserTeams(idToken: string): Promise<{ teams: Team[]; currentTeamId: string | null }> {
    const response = await fetch(`${API_URL}/teams`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }

    return await response.json();
  }

  /**
   * Get a specific team by ID
   */
  async getTeam(teamId: string, idToken: string): Promise<Team> {
    const response = await fetch(`${API_URL}/teams/${teamId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch team');
    }

    const data = await response.json();
    return data.team;
  }

  /**
   * Switch to a different team
   */
  async switchTeam(teamId: string, idToken: string): Promise<void> {
    const response = await fetch(`${API_URL}/teams/${teamId}/switch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to switch team');
    }
  }

  /**
   * Get all members of a team (Story 3.5-5)
   */
  async getTeamMembers(teamId: string, idToken: string): Promise<TeamMember[]> {
    const response = await fetch(`${API_URL}/teams/${teamId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch team members');
    }

    const data = await response.json();
    return data.members || [];
  }
}
