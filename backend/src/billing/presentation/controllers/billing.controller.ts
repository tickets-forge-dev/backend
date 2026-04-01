import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetQuotaUseCase } from '../../application/use-cases/GetQuotaUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';

@Controller('billing')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class BillingController {
  constructor(private readonly getQuotaUseCase: GetQuotaUseCase) {}

  @Get('quota')
  async getQuota(@TeamId() teamId: string) {
    return this.getQuotaUseCase.execute({ teamId });
  }
}
