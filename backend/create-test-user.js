// Quick script to create test user for invite testing
const admin = require('firebase-admin');

// Initialize Firebase (will use GOOGLE_APPLICATION_CREDENTIALS from env)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createTestUser() {
  const testUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    currentTeamId: null,
    currentWorkspaceId: 'workspace-test-default',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection('users').doc('test-user-123').set(testUser);
    console.log('✅ Test user created:', testUser);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }

  process.exit(0);
}

createTestUser();
