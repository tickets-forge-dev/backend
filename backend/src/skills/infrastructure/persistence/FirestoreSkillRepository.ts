import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';
import { SkillRepository } from '../../application/ports/SkillRepository.port';
import { Skill } from '../../domain/Skill';

@Injectable()
export class FirestoreSkillRepository implements SkillRepository {
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
}
