import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';

export interface CancelSessionCommand {
  sessionId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class CancelSessionUseCase {
  private readonly logger = new Logger(CancelSessionUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: CancelSessionCommand): Promise<void> {
    const { sessionId, userId, teamId } = command;

    const session = await this.sessionRepository.findById(sessionId, teamId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.isTerminal()) {
      throw new ConflictException(`Session is already ${session.status}`);
    }

    session.markCancelled();
    await this.sessionRepository.save(session);
    this.logger.log(`Session ${sessionId} cancelled by ${userId}`);
  }
}
