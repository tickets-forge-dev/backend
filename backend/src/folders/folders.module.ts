import { Module, forwardRef } from '@nestjs/common';
import { FoldersController } from './presentation/controllers/folders.controller';
import { FirestoreFolderRepository } from './infrastructure/persistence/FirestoreFolderRepository';
import { FOLDER_REPOSITORY } from './application/ports/FolderRepository';
import { CreateFolderUseCase } from './application/use-cases/CreateFolderUseCase';
import { ListFoldersUseCase } from './application/use-cases/ListFoldersUseCase';
import { RenameFolderUseCase } from './application/use-cases/RenameFolderUseCase';
import { DeleteFolderUseCase } from './application/use-cases/DeleteFolderUseCase';
import { MoveTicketToFolderUseCase } from './application/use-cases/MoveTicketToFolderUseCase';
import { UpdateFolderScopeUseCase } from './application/use-cases/UpdateFolderScopeUseCase';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { TicketsModule } from '../tickets/tickets.module';
import { AEC_REPOSITORY } from '../tickets/application/ports/AECRepository';

@Module({
  imports: [forwardRef(() => TicketsModule)],
  controllers: [FoldersController],
  providers: [
    // Repository (bound to port interface)
    {
      provide: FOLDER_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreFolderRepository(firestore);
      },
      inject: [FirebaseService],
    },
    // Use Cases
    {
      provide: CreateFolderUseCase,
      useFactory: (folderRepo) => new CreateFolderUseCase(folderRepo),
      inject: [FOLDER_REPOSITORY],
    },
    {
      provide: ListFoldersUseCase,
      useFactory: (folderRepo) => new ListFoldersUseCase(folderRepo),
      inject: [FOLDER_REPOSITORY],
    },
    {
      provide: RenameFolderUseCase,
      useFactory: (folderRepo) => new RenameFolderUseCase(folderRepo),
      inject: [FOLDER_REPOSITORY],
    },
    {
      provide: DeleteFolderUseCase,
      useFactory: (folderRepo, aecRepo) => new DeleteFolderUseCase(folderRepo, aecRepo),
      inject: [FOLDER_REPOSITORY, AEC_REPOSITORY],
    },
    {
      provide: MoveTicketToFolderUseCase,
      useFactory: (folderRepo, aecRepo) => new MoveTicketToFolderUseCase(folderRepo, aecRepo),
      inject: [FOLDER_REPOSITORY, AEC_REPOSITORY],
    },
    {
      provide: UpdateFolderScopeUseCase,
      useFactory: (folderRepo, aecRepo) => new UpdateFolderScopeUseCase(folderRepo, aecRepo),
      inject: [FOLDER_REPOSITORY, AEC_REPOSITORY],
    },
  ],
  exports: [FOLDER_REPOSITORY],
})
export class FoldersModule {}
