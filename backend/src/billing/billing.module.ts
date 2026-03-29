import { Module } from '@nestjs/common';
import { USAGE_QUOTA_REPOSITORY } from './application/ports';
import { FirestoreUsageQuotaRepository } from './infrastructure/persistence/FirestoreUsageQuotaRepository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: USAGE_QUOTA_REPOSITORY,
      useClass: FirestoreUsageQuotaRepository,
    },
  ],
  exports: [USAGE_QUOTA_REPOSITORY],
})
export class BillingModule {}
