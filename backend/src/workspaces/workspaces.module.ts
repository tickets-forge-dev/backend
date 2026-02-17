import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { CreateWorkspaceUseCase } from './application/use-cases/CreateWorkspaceUseCase';
import { FirestoreWorkspaceRepository } from './infrastructure/persistence/FirestoreWorkspaceRepository';
import { WORKSPACE_REPOSITORY } from './application/ports/WorkspaceRepository';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [TeamsModule], // Import TeamsModule to get FirestoreUserRepository
  controllers: [AuthController],
  providers: [
    CreateWorkspaceUseCase,
    {
      provide: WORKSPACE_REPOSITORY,
      useClass: FirestoreWorkspaceRepository,
    },
  ],
  exports: [WORKSPACE_REPOSITORY, CreateWorkspaceUseCase],
})
export class WorkspacesModule {}
