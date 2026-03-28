import { Global, Module } from '@nestjs/common';
import { FirestoreOrganizationRepository } from './infrastructure/persistence/FirestoreOrganizationRepository';
import { ORGANIZATION_REPOSITORY } from './application/ports/OrganizationRepository';
import { FirebaseService } from '../shared/infrastructure/firebase/firebase.config';

/**
 * OrganizationsModule
 *
 * Provides organization management functionality.
 * Global module so OrganizationRepository is available everywhere.
 */
@Global()
@Module({
  providers: [
    {
      provide: ORGANIZATION_REPOSITORY,
      useFactory: (firebaseService: FirebaseService) => {
        const firestore = firebaseService.getFirestore();
        return new FirestoreOrganizationRepository(firestore);
      },
      inject: [FirebaseService],
    },
  ],
  exports: [ORGANIZATION_REPOSITORY],
})
export class OrganizationsModule {}
