import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { TicketsModule } from './tickets/tickets.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { GitHubModule } from './github/github.module';
import { LinearModule } from './linear/linear.module';
import { JiraModule } from './jira/jira.module';
import { ConfigModule as ConfigApiModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    WorkspacesModule,
    TicketsModule,
    GitHubModule,
    LinearModule,
    JiraModule,
    ConfigApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
