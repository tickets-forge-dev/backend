import { ProjectProfile } from '../../domain/ProjectProfile';

export interface ProjectProfileRepository {
  save(profile: ProjectProfile): Promise<void>;
  findById(profileId: string, teamId: string): Promise<ProjectProfile | null>;
  findByRepo(teamId: string, repoOwner: string, repoName: string): Promise<ProjectProfile | null>;
  findAllByTeam(teamId: string): Promise<ProjectProfile[]>;
  delete(profileId: string, teamId: string): Promise<void>;
}

export const PROJECT_PROFILE_REPOSITORY = Symbol('ProjectProfileRepository');
