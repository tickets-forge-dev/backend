import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { Organization } from '../../domain/Organization';
import { OrganizationRepository, ORGANIZATION_REPOSITORY } from '../../application/ports/OrganizationRepository';
import { Inject } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

/**
 * CreatePersonalOrgsMigration
 *
 * Creates personal organizations for existing users and assigns
 * organizations to existing teams. Idempotent: safe to run multiple times.
 */
@Injectable()
export class CreatePersonalOrgsMigration {
  private readonly logger = new Logger(CreatePersonalOrgsMigration.name);
  private readonly firestore: Firestore;

  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
    firebaseService: FirebaseService,
  ) {
    this.firestore = firebaseService.getFirestore();
  }

  async migrate(): Promise<void> {
    this.logger.log('Starting personal organizations migration...');

    await this.createPersonalOrgsForUsers();
    await this.assignOrgsToTeams();

    this.logger.log('Personal organizations migration complete.');
  }

  /**
   * Create personal organizations for users that don't have one yet.
   */
  private async createPersonalOrgsForUsers(): Promise<void> {
    this.logger.log('Creating personal orgs for users without one...');

    const usersSnapshot = await this.firestore.collection('users').get();
    let created = 0;
    let skipped = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Skip users that already have an organizationId
      if (userData.organizationId) {
        skipped++;
        continue;
      }

      // Build display name from available fields
      const displayName =
        userData.displayName ||
        [userData.firstName, userData.lastName].filter(Boolean).join(' ') ||
        userData.email ||
        'User';

      // Create personal org
      const org = Organization.createPersonal(userId, displayName);
      await this.organizationRepository.save(org);

      // Update user document with organizationId
      await this.firestore.collection('users').doc(userId).update({
        organizationId: org.getId().getValue(),
      });

      created++;
      this.logger.log(
        `Created personal org "${org.getName()}" (${org.getId().getValue()}) for user ${userId}`,
      );
    }

    this.logger.log(
      `Users migration done: ${created} created, ${skipped} skipped (already had org).`,
    );
  }

  /**
   * Assign organizations to teams that don't have one yet.
   */
  private async assignOrgsToTeams(): Promise<void> {
    this.logger.log('Assigning orgs to teams without one...');

    const teamsSnapshot = await this.firestore.collection('teams').get();
    let updated = 0;
    let skipped = 0;

    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const teamId = teamDoc.id;

      // Skip teams that already have an organizationId
      if (teamData.organizationId) {
        skipped++;
        continue;
      }

      const ownerId = teamData.ownerId;
      if (!ownerId) {
        this.logger.warn(`Team ${teamId} has no ownerId, skipping.`);
        continue;
      }

      // Look up the owner's personal org
      const personalOrg = await this.organizationRepository.getPersonalOrg(ownerId);
      if (!personalOrg) {
        this.logger.warn(
          `No personal org found for owner ${ownerId} of team ${teamId}, skipping.`,
        );
        continue;
      }

      // Update team document with organizationId
      await this.firestore.collection('teams').doc(teamId).update({
        organizationId: personalOrg.getId().getValue(),
      });

      updated++;
      this.logger.log(
        `Assigned org ${personalOrg.getId().getValue()} to team ${teamId}`,
      );
    }

    this.logger.log(
      `Teams migration done: ${updated} updated, ${skipped} skipped (already had org).`,
    );
  }
}
