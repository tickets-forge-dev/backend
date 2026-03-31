import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { SkillRepository } from '../../application/ports/SkillRepository.port';
import { Skill } from '../../domain/Skill';
import { SEED_SKILLS } from '../seed/skill-seed';

@Injectable()
export class FirestoreSkillRepository implements SkillRepository {
  private readonly logger = new Logger(FirestoreSkillRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async findAllEnabled(): Promise<Skill[]> {
    const firestore = this.firebaseService.getFirestore();
    const snapshot = await firestore
      .collection('skills')
      .where('enabled', '==', true)
      .orderBy('order')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  }

  async findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    const firestore = this.firebaseService.getFirestore();
    const docs = await Promise.all(
      ids.map(id => firestore.collection('skills').doc(id).get())
    );
    return docs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() } as Skill));
  }

  async seedIfEmpty(): Promise<void> {
    const existing = await this.findAllEnabled();
    if (existing.length > 0) {
      this.logger.log(`Skill catalog already has ${existing.length} entries, skipping seed`);
      return;
    }

    this.logger.log(`Seeding ${SEED_SKILLS.length} skills into Firestore...`);
    const firestore = this.firebaseService.getFirestore();
    const batch = firestore.batch();

    for (const skill of SEED_SKILLS) {
      const ref = firestore.collection('skills').doc(skill.pluginDirName);
      batch.set(ref, skill);
    }

    await batch.commit();
    this.logger.log(`Seeded ${SEED_SKILLS.length} skills successfully`);
  }
}
