import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';
import { USAGE_QUOTA_REPOSITORY } from '../../../billing/application/ports';
import type { UsageQuotaRepository } from '../../../billing/application/ports/UsageQuotaRepository.port';
import { AECRepository, AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { AECStatus } from '../../../tickets/domain/value-objects/AECStatus';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { Session } from '../../domain/Session';
import { analyzeComplexity } from '../services/ComplexityAnalyzer';

export interface StartSessionCommand {
  ticketId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class StartSessionUseCase {
  private readonly logger = new Logger(StartSessionUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(USAGE_QUOTA_REPOSITORY) private readonly quotaRepository: UsageQuotaRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: StartSessionCommand): Promise<{ sessionId: string; repoOwner: string; repoName: string; branch: string; model: string; maxDurationMs: number; fileChanges: string[] }> {
    const { ticketId, userId, teamId } = command;

    // 1. Load and validate ticket
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    if (aec.teamId !== teamId) {
      throw new ForbiddenException('Ticket does not belong to your team');
    }
    if (aec.status !== AECStatus.APPROVED) {
      throw new ConflictException(`Ticket must be approved, currently: ${aec.status}`);
    }

    // 2. Check quota
    const period = new Date().toISOString().slice(0, 7);
    let quota;
    try {
      quota = await this.quotaRepository.getOrCreate(teamId, period);
      this.logger.log(`Quota for team ${teamId}: ${quota.used}/${quota.limit} (remaining: ${quota.remaining})`);
    } catch (quotaError) {
      this.logger.warn(`Failed to check quota for team ${teamId}, allowing session: ${quotaError}`);
      // If quota check fails, allow the session (fail-open for MVP)
      quota = null;
    }
    if (quota && !quota.canStartSession()) {
      throw new ForbiddenException({
        message: `Development quota exhausted: ${quota.used}/${quota.limit}. Upgrade your plan for more developments.`,
        code: 'QUOTA_EXCEEDED',
      });
    }

    // 3. Check for existing active session
    const existingSession = await this.sessionRepository.findActiveByTicket(ticketId, teamId);
    if (existingSession) {
      // If the session is stale (>5 min in provisioning, or >35 min in running), clean it up
      const ageMs = Date.now() - existingSession.createdAt.getTime();
      const isStaleProvisioning = existingSession.status === 'provisioning' && ageMs > 5 * 60 * 1000;
      const isStaleRunning = existingSession.status === 'running' && ageMs > 35 * 60 * 1000;

      if (isStaleProvisioning || isStaleRunning) {
        this.logger.warn(`Cleaning up stale session ${existingSession.id} (status: ${existingSession.status}, age: ${Math.round(ageMs / 1000)}s)`);
        existingSession.markFailed('Session timed out (stale cleanup)');
        await this.sessionRepository.save(existingSession);
      } else {
        throw new ConflictException(`Ticket already has an active session: ${existingSession.id}`);
      }
    }

    // 4. Resolve repo owner/name from repositoryContext (owner/repo format)
    const repoContext = aec.repositoryContext;
    const repoOwner = repoContext?.owner ?? '';
    const repoName = repoContext?.repo ?? '';

    // 5. Create session
    const session = Session.createNew({
      ticketId,
      teamId,
      userId,
      ticketTitle: aec.title,
      repoOwner,
      repoName,
      branch: `feat/${ticketId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    });

    await this.sessionRepository.save(session);
    this.logger.log(`Session ${session.id} created for ticket ${ticketId}`);

    // 6. Transition ticket APPROVED → EXECUTING
    try {
      aec.startImplementation(session.branch);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    await this.aecRepository.save(aec);

    // 7. Analyze complexity to determine model + timeout
    const fileChanges: string[] = (aec.techSpec?.fileChanges ?? []).map(fc => fc.path);
    const complexity = analyzeComplexity({
      fileChangeCount: fileChanges.length,
      acceptanceCriteriaCount: (aec.techSpec?.acceptanceCriteria?.length ?? 0) as number,
      scopeEstimate: ((aec.techSpec as any)?.estimatedScope ?? 'medium') as 'small' | 'medium' | 'large',
      specText: `${aec.title} ${(aec.techSpec as any)?.problemStatement?.narrative ?? ''}`,
    });

    this.logger.log(
      `Session ${session.id} model routing: ${complexity.model} (${complexity.reason})`,
    );

    return {
      sessionId: session.id,
      repoOwner,
      repoName,
      branch: session.branch,
      model: complexity.model,
      maxDurationMs: complexity.maxDurationMs,
      fileChanges,
    };
  }
}
