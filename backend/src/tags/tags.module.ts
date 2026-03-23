import { Module, forwardRef } from '@nestjs/common';
import { TagsController } from './presentation/controllers/tags.controller';
import { FirestoreTagRepository } from './infrastructure/persistence/FirestoreTagRepository';
import { TAG_REPOSITORY } from './application/ports/TagRepository';
import { CreateTagUseCase } from './application/use-cases/CreateTagUseCase';
import { ListTagsUseCase } from './application/use-cases/ListTagsUseCase';
import { UpdateTagUseCase } from './application/use-cases/UpdateTagUseCase';
import { DeleteTagUseCase } from './application/use-cases/DeleteTagUseCase';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { TicketsModule } from '../tickets/tickets.module';
import { AEC_REPOSITORY } from '../tickets/application/ports/AECRepository';

@Module({
  imports: [forwardRef(() => TicketsModule)],
  controllers: [TagsController],
  providers: [
    // Repository (bound to port interface)
    {
      provide: TAG_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreTagRepository(firestore);
      },
      inject: [FirebaseService],
    },
    // Use Cases
    {
      provide: CreateTagUseCase,
      useFactory: (tagRepo) => new CreateTagUseCase(tagRepo),
      inject: [TAG_REPOSITORY],
    },
    {
      provide: ListTagsUseCase,
      useFactory: (tagRepo) => new ListTagsUseCase(tagRepo),
      inject: [TAG_REPOSITORY],
    },
    {
      provide: UpdateTagUseCase,
      useFactory: (tagRepo) => new UpdateTagUseCase(tagRepo),
      inject: [TAG_REPOSITORY],
    },
    {
      provide: DeleteTagUseCase,
      useFactory: (tagRepo, aecRepo) => new DeleteTagUseCase(tagRepo, aecRepo),
      inject: [TAG_REPOSITORY, AEC_REPOSITORY],
    },
  ],
  exports: [TAG_REPOSITORY],
})
export class TagsModule {}
