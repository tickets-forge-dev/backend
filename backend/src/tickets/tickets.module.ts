import { Module } from '@nestjs/common';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { FirestoreAECRepository } from './infrastructure/persistence/FirestoreAECRepository';
import { AEC_REPOSITORY } from './application/ports/AECRepository';
import { Firestore } from 'firebase-admin/firestore';

@Module({
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    {
      provide: AEC_REPOSITORY,
      useFactory: (firestore: Firestore) => {
        return new FirestoreAECRepository(firestore);
      },
      inject: ['FIRESTORE'],
    },
  ],
  exports: [CreateTicketUseCase, UpdateAECUseCase, AEC_REPOSITORY],
})
export class TicketsModule {}
