import { Module } from '@nestjs/common';
import { TicketsController } from './presentation/controllers/tickets.controller';
import { CreateTicketUseCase } from './application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from './application/use-cases/UpdateAECUseCase';
import { GenerationOrchestrator } from './application/services/GenerationOrchestrator';
import { FirestoreAECRepository } from './infrastructure/persistence/FirestoreAECRepository';
import { AEC_REPOSITORY } from './application/ports/AECRepository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

@Module({
  controllers: [TicketsController],
  providers: [
    CreateTicketUseCase,
    UpdateAECUseCase,
    GenerationOrchestrator,
    {
      provide: AEC_REPOSITORY,
      useClass: FirestoreAECRepository,
    },
  ],
  exports: [CreateTicketUseCase, UpdateAECUseCase, AEC_REPOSITORY],
})
export class TicketsModule {}
