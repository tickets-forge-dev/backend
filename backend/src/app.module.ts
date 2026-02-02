import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { TicketsModule } from './tickets/tickets.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { GitHubModule } from './github/github.module';
import { IndexingModule } from './indexing/indexing.module';

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
    IndexingModule,
    // Additional feature modules will be added in subsequent stories
    // IntegrationsModule (Story 5.x)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
