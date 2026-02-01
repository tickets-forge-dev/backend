import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { CreateWorkspaceUseCase } from './application/use-cases/CreateWorkspaceUseCase';
import { FirestoreWorkspaceRepository } from './infrastructure/persistence/FirestoreWorkspaceRepository';
import { WORKSPACE_REPOSITORY } from './application/ports/WorkspaceRepository';

@Module({
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
