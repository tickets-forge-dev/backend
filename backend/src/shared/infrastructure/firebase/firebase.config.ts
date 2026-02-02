import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App | null = null;
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    // Initialize Firebase synchronously in constructor to ensure it's ready
    // before any other services try to use it
    this.initializeFirebase();
  }

  onModuleInit() {
    // This is now a no-op since we initialize in constructor
    // But we keep it to log status after all modules are loaded
    if (this.isConfigured) {
      console.log('✅ Firebase ready for use');
    }
  }

  private initializeFirebase() {
    console.log('🔍 [FirebaseService] Initializing Firebase Admin SDK...');
    
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    console.log('🔍 [FirebaseService] Config values:');
    console.log('   - projectId:', projectId ? '✓' : '✗');
    console.log('   - privateKey:', privateKey ? `✓ (${privateKey.substring(0, 50)}...)` : '✗');
    console.log('   - clientEmail:', clientEmail ? '✓' : '✗');

    if (!projectId || !privateKey || !clientEmail) {
      console.warn(
        '⚠️  Firebase Admin SDK not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env',
      );
      console.warn(
        '   Backend will run without Firebase (API endpoints available, but persistence disabled)',
      );
      return;
    }

    try {
      console.log('🔄 [FirebaseService] Attempting to initialize Firebase...');
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.isConfigured = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error: any) {
      console.error('❌ Firebase initialization failed:', error.message);
      console.error('   Full error:', error);
      console.warn('   Backend will run without Firebase');
    }
  }

  getAuth() {
    if (!this.app) {
      throw new Error('Firebase not configured. Cannot access Auth.');
    }
    return admin.auth(this.app);
  }

  getFirestore() {
    if (!this.app) {
      throw new Error('Firebase not configured. Cannot access Firestore.');
    }
    return admin.firestore(this.app);
  }

  getStorage() {
    if (!this.app) {
      throw new Error('Firebase not configured. Cannot access Storage.');
    }
    return admin.storage(this.app);
  }

  isFirebaseConfigured(): boolean {
    return this.isConfigured;
  }
}
