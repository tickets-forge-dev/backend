import { Module } from '@nestjs/common';
import { TeamsController } from './presentation/controllers/teams.controller';
import { FirestoreTeamRepository } from './infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';
import { CreateTeamUseCase } from './application/use-cases/CreateTeamUseCase';
import { UpdateTeamUseCase } from './application/use-cases/UpdateTeamUseCase';
import { GetTeamUseCase } from './application/use-cases/GetTeamUseCase';
import { GetUserTeamsUseCase } from './application/use-cases/GetUserTeamsUseCase';
import { SwitchTeamUseCase } from './application/use-cases/SwitchTeamUseCase';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

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
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreTeamRepository(firestore);
      },
      inject: [FirebaseService],
    },
    {
      provide: FirestoreUserRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreUserRepository(firestore);
      },
      inject: [FirebaseService],
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
