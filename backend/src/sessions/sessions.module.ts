import { Module } from '@nestjs/common';
import { SessionsController } from './presentation/controllers/sessions.controller';
import { StartSessionUseCase } from './application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from './application/use-cases/CancelSessionUseCase';
import { SESSION_REPOSITORY } from './application/ports';
import { SANDBOX_PORT } from './application/ports/SandboxPort';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';
import { StubSandboxAdapter } from './infrastructure/sandbox/StubSandboxAdapter';
import { SessionOrchestrator } from './application/services/SessionOrchestrator';
import { TicketsModule } from '../tickets/tickets.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TicketsModule, BillingModule],
  controllers: [SessionsController],
  providers: [
    StartSessionUseCase,
    CancelSessionUseCase,
    SessionOrchestrator,
    {
      provide: SESSION_REPOSITORY,
      useClass: FirestoreSessionRepository,
    },
    {
      provide: SANDBOX_PORT,
      useClass: StubSandboxAdapter,
    },
  ],
  exports: [SESSION_REPOSITORY, SessionOrchestrator],
})
export class SessionsModule {}
