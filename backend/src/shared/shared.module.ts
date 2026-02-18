import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './infrastructure/firebase/firebase.config';
import { GitHubApiService } from './infrastructure/github/github-api.service';
import { EmailService } from './infrastructure/email/EmailService';
import { SendGridEmailService } from './infrastructure/email/SendGridEmailService';
import { FirestoreUserRepository } from '../users/infrastructure/persistence/FirestoreUserRepository';
import { FirestoreTeamRepository } from '../teams/infrastructure/persistence/FirestoreTeamRepository';

@Global()
@Module({
  providers: [
    FirebaseService,
    GitHubApiService,
    {
      provide: EmailService,
      useClass: SendGridEmailService,
    },
    // Add repositories needed by WorkspaceGuard (globally available)
    {
      provide: FirestoreUserRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreUserRepository(firestore);
      },
      inject: [FirebaseService],
    },
    {
      provide: FirestoreTeamRepository,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreTeamRepository(firestore);
      },
      inject: [FirebaseService],
    },
  ],
  exports: [
    FirebaseService,
    GitHubApiService,
    EmailService,
    FirestoreUserRepository,
    FirestoreTeamRepository,
  ],
})
export class SharedModule {}
