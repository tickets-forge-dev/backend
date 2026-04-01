import { Module } from '@nestjs/common';
import { USAGE_QUOTA_REPOSITORY } from './application/ports';
import { FirestoreUsageQuotaRepository } from './infrastructure/persistence/FirestoreUsageQuotaRepository';
import { GetQuotaUseCase } from './application/use-cases/GetQuotaUseCase';
import { BillingController } from './presentation/controllers/billing.controller';

@Module({
  imports: [],
  controllers: [BillingController],
  providers: [
    {
      provide: USAGE_QUOTA_REPOSITORY,
      useClass: FirestoreUsageQuotaRepository,
    },
    GetQuotaUseCase,
  ],
  exports: [USAGE_QUOTA_REPOSITORY],
})
export class BillingModule {}
