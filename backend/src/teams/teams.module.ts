import { Module } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { TeamsController } from './presentation/controllers/teams.controller';
import { FirestoreTeamRepository } from './infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';
import { CreateTeamUseCase } from './application/use-cases/CreateTeamUseCase';
import { UpdateTeamUseCase } from './application/use-cases/UpdateTeamUseCase';
import { GetTeamUseCase } from './application/use-cases/GetTeamUseCase';
import { GetUserTeamsUseCase } from './application/use-cases/GetUserTeamsUseCase';
import { SwitchTeamUseCase } from './application/use-cases/SwitchTeamUseCase';

/**
 * TeamsModule
 *
 * Provides team management functionality.
 */
@Module({
  controllers: [TeamsController],
  providers: [
    // Repositories
    {
      provide: FirestoreTeamRepository,
      useFactory: () => {
        const firestore = new Firestore();
        return new FirestoreTeamRepository(firestore);
      },
    },
    {
      provide: FirestoreUserRepository,
      useFactory: () => {
        const firestore = new Firestore();
        return new FirestoreUserRepository(firestore);
      },
    },
    // Use Cases
    CreateTeamUseCase,
    UpdateTeamUseCase,
    GetTeamUseCase,
    GetUserTeamsUseCase,
    SwitchTeamUseCase,
  ],
  exports: [
    FirestoreTeamRepository,
    FirestoreUserRepository,
  ],
})
export class TeamsModule {}
