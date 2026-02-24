import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  JiraIntegrationRepository,
  JIRA_INTEGRATION_REPOSITORY,
} from '../../../jira/domain/JiraIntegrationRepository';
import {
  LinearIntegrationRepository,
  LINEAR_INTEGRATION_REPOSITORY,
} from '../../../linear/domain/LinearIntegrationRepository';

interface GetImportAvailabilityCommand {
  teamId: string;
  userId: string;
}

export interface ImportAvailabilityResult {
  jira: {
    connected: boolean;
    jiraUrl?: string | null;
    username?: string | null;
  };
  linear: {
    connected: boolean;
    userName?: string | null;
    teamId?: string | null;
    teamName?: string | null;
  };
}

@Injectable()
export class GetImportAvailabilityUseCase {
  private readonly logger = new Logger(GetImportAvailabilityUseCase.name);

  constructor(
    @Inject(JIRA_INTEGRATION_REPOSITORY)
    private readonly jiraIntegrationRepo: JiraIntegrationRepository,
    @Inject(LINEAR_INTEGRATION_REPOSITORY)
    private readonly linearIntegrationRepo: LinearIntegrationRepository,
  ) {}

  async execute(command: GetImportAvailabilityCommand): Promise<ImportAvailabilityResult> {
    const [jiraIntegration, linearIntegration] = await Promise.all([
      this.jiraIntegrationRepo.findByUserAndWorkspace(command.userId, command.teamId),
      this.linearIntegrationRepo.findByWorkspaceId(command.teamId),
    ]);

    return {
      jira: jiraIntegration
        ? {
            connected: true,
            jiraUrl: jiraIntegration.jiraUrl,
            username: jiraIntegration.username,
          }
        : {
            connected: false,
          },
      linear: linearIntegration
        ? {
            connected: true,
            userName: linearIntegration.userName,
            teamId: linearIntegration.teamId,
            teamName: linearIntegration.teamName,
          }
        : {
            connected: false,
          },
    };
  }
}
