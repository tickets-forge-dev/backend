import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { TicketsModule } from './tickets/tickets.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { GitHubModule } from './github/github.module';
import { LinearModule } from './linear/linear.module';
import { JiraModule } from './jira/jira.module';
import { FigmaModule } from './integrations/figma/figma.module';
import { ConfigModule as ConfigApiModule } from './config/config.module';
import { FeedbackModule } from './feedback/feedback.module';
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';
import { JobsModule } from './jobs/jobs.module';
import { ProjectProfilesModule } from './project-profiles/project-profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    AuthModule,
    TeamsModule, // CRITICAL FIX: Register teams endpoints
    WorkspacesModule,
    TicketsModule,
    GitHubModule,
    LinearModule,
    JiraModule,
    FigmaModule,
    ConfigApiModule,
    FeedbackModule,
    FoldersModule,
    TagsModule,
    JobsModule,
    ProjectProfilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
