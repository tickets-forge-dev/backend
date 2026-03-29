import { Module } from '@nestjs/common';
import { SessionsController } from './presentation/controllers/sessions.controller';
import { StartSessionUseCase } from './application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from './application/use-cases/CancelSessionUseCase';
import { SESSION_REPOSITORY } from './application/ports';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';
import { TicketsModule } from '../tickets/tickets.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TicketsModule, BillingModule],
  controllers: [SessionsController],
  providers: [
    StartSessionUseCase,
    CancelSessionUseCase,
    {
      provide: SESSION_REPOSITORY,
      useClass: FirestoreSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionsModule {}
