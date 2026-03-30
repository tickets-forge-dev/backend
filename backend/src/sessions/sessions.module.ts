import { Module } from '@nestjs/common';
import { SessionsController } from './presentation/controllers/sessions.controller';
import { StartSessionUseCase } from './application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from './application/use-cases/CancelSessionUseCase';
import { SESSION_REPOSITORY } from './application/ports';
import { SANDBOX_PORT } from './application/ports/SandboxPort';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';
import { StubSandboxAdapter } from './infrastructure/sandbox/StubSandboxAdapter';
import { E2BSandboxAdapter } from './infrastructure/sandbox/E2BSandboxAdapter';
import { SessionOrchestrator } from './application/services/SessionOrchestrator';
import { TicketsModule } from '../tickets/tickets.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TicketsModule, BillingModule, NotificationsModule],
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
      useFactory: () => {
        if (process.env.E2B_API_KEY) {
          return new E2BSandboxAdapter();
        }
        return new StubSandboxAdapter();
      },
    },
  ],
  exports: [SESSION_REPOSITORY, SessionOrchestrator],
})
export class SessionsModule {}
