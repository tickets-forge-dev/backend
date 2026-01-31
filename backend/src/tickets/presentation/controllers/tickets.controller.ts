import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateTicketUseCase } from '../../application/use-cases/CreateTicketUseCase';
import { UpdateAECUseCase } from '../../application/use-cases/UpdateAECUseCase';
import { CreateTicketDto } from '../dto/CreateTicketDto';
import { UpdateAECDto } from '../dto/UpdateAECDto';
import { AECRepository, AEC_REPOSITORY } from '../../application/ports/AECRepository';
import { Inject } from '@nestjs/common';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly updateAECUseCase: UpdateAECUseCase,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() dto: CreateTicketDto) {
    // TODO: Extract workspaceId from Firebase Auth token (Story 2.3)
    // For now, using hardcoded workspace for development
    const workspaceId = 'ws_dev';

    const aec = await this.createTicketUseCase.execute({
      workspaceId,
      title: dto.title,
      description: dto.description,
    });

    return this.mapToResponse(aec);
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    const aec = await this.aecRepository.findById(id);
    if (!aec) {
      throw new Error('AEC not found');
    }
    return this.mapToResponse(aec);
  }

  @Get()
  async listTickets() {
    // TODO: Extract workspaceId from Firebase Auth token
    const workspaceId = 'ws_dev';

    const aecs = await this.aecRepository.findByWorkspace(workspaceId);
    return aecs.map((aec) => this.mapToResponse(aec));
  }

  @Patch(':id')
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateAECDto) {
    const aec = await this.updateAECUseCase.execute({
      aecId: id,
      acceptanceCriteria: dto.acceptanceCriteria,
      assumptions: dto.assumptions,
    });

    return this.mapToResponse(aec);
  }

  private mapToResponse(aec: any) {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      title: aec.title,
      description: aec.description,
      type: aec.type,
      readinessScore: aec.readinessScore,
      generationState: aec.generationState,
      acceptanceCriteria: aec.acceptanceCriteria,
      assumptions: aec.assumptions,
      repoPaths: aec.repoPaths,
      codeSnapshot: aec.codeSnapshot,
      apiSnapshot: aec.apiSnapshot,
      questions: aec.questions,
      estimate: aec.estimate,
      validationResults: aec.validationResults,
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt,
      createdAt: aec.createdAt,
      updatedAt: aec.updatedAt,
    };
  }
}
