import { Module } from '@nestjs/common';
import { SESSION_REPOSITORY } from './application/ports';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: FirestoreSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionsModule {}
