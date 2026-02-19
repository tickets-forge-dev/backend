import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
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

    // Option 1: Try loading from JSON service account (more reliable for Render)
    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

    let projectId: string | undefined;
    let privateKey: string | undefined;
    let clientEmail: string | undefined;

    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        projectId = serviceAccount.project_id;
        privateKey = serviceAccount.private_key;
        clientEmail = serviceAccount.client_email;
        console.log('✓ Using FIREBASE_SERVICE_ACCOUNT_JSON');
      } catch (error) {
        console.warn('⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to individual vars');
      }
    }

    // Option 2: Fall back to individual environment variables
    if (!projectId || !privateKey || !clientEmail) {
      projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');
      clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      console.log('✓ Using individual FIREBASE_* environment variables');
    }

    console.log('🔍 [FirebaseService] Config values:');
    console.log('   - projectId:', projectId ? '✓' : '✗');
    console.log('   - privateKey:', privateKey ? `✓ (length: ${privateKey?.length} bytes)` : '✗');
    console.log('   - clientEmail:', clientEmail ? '✓' : '✗');

    if (!projectId || !privateKey || !clientEmail) {
      console.warn(
        '⚠️  Firebase Admin SDK not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or individual FIREBASE_* vars',
      );
      console.warn(
        '   Backend will run without Firebase (API endpoints available, but persistence disabled)',
      );
      return;
    }

    try {
      console.log('🔄 [FirebaseService] Attempting to initialize Firebase...');
      const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || `${projectId}.firebasestorage.app`;
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
        storageBucket,
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
      throw new ServiceUnavailableException(
        'Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env',
      );
    }
    return admin.auth(this.app);
  }

  getFirestore() {
    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env',
      );
    }
    return admin.firestore(this.app);
  }

  getStorage() {
    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env',
      );
    }
    return admin.storage(this.app);
  }

  isFirebaseConfigured(): boolean {
    return this.isConfigured;
  }
}
