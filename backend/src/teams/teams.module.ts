import { Module } from '@nestjs/common';
import { TeamsController } from './presentation/controllers/teams.controller';
import { FirestoreTeamRepository } from './infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreTeamMemberRepository } from './infrastructure/persistence/FirestoreTeamMemberRepository';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';
import { CreateTeamUseCase } from './application/use-cases/CreateTeamUseCase';
import { UpdateTeamUseCase } from './application/use-cases/UpdateTeamUseCase';
import { DeleteTeamUseCase } from './application/use-cases/DeleteTeamUseCase';
import { GetTeamUseCase } from './application/use-cases/GetTeamUseCase';
import { GetUserTeamsUseCase } from './application/use-cases/GetUserTeamsUseCase';
import { SwitchTeamUseCase } from './application/use-cases/SwitchTeamUseCase';
import { SyncUserTeamsUseCase } from './application/use-cases/SyncUserTeamsUseCase';
import { InviteMemberUseCase } from './application/use-cases/InviteMemberUseCase';
import { AcceptInviteUseCase } from './application/use-cases/AcceptInviteUseCase';
import { RemoveMemberUseCase } from './application/use-cases/RemoveMemberUseCase';
import { ChangeMemberRoleUseCase } from './application/use-cases/ChangeMemberRoleUseCase';
import { ListTeamMembersUseCase } from './application/use-cases/ListTeamMembersUseCase';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';
import { InviteTokenService } from './application/services/InviteTokenService';

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
      provide: FirestoreTeamMemberRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreTeamMemberRepository(firestore);
      },
      inject: [FirebaseService],
    },
    {
      provide: 'TeamMemberRepository',
      useExisting: FirestoreTeamMemberRepository,
    },
    {
      provide: FirestoreUserRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreUserRepository(firestore);
      },
      inject: [FirebaseService],
    },
    // Use Cases - Team Management
    CreateTeamUseCase,
    UpdateTeamUseCase,
    DeleteTeamUseCase,
    GetTeamUseCase,
    GetUserTeamsUseCase,
    SwitchTeamUseCase,
    SyncUserTeamsUseCase,
    // Use Cases - Member Management
    InviteMemberUseCase,
    AcceptInviteUseCase,
    RemoveMemberUseCase,
    ChangeMemberRoleUseCase,
    ListTeamMembersUseCase,
    // Services
    InviteTokenService,
  ],
  exports: [
    FirestoreTeamRepository,
    FirestoreTeamMemberRepository,
    FirestoreUserRepository,
  ],
})
export class TeamsModule {}
