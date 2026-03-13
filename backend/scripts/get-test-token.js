#!/usr/bin/env node
/**
 * Generates a Firebase ID token for E2E testing.
 * Reads credentials from backend/.env, creates a custom token for a test user,
 * then exchanges it for an ID token via the Firebase REST API.
 *
 * Usage: node scripts/get-test-token.js
 * Output: prints the ID token to stdout
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

let currentKey = null;
let currentVal = '';
let inMultiline = false;

for (const line of envContent.split('\n')) {
  if (inMultiline) {
    currentVal += '\n' + line;
    // Check if this line ends the multiline value
    if (line.endsWith('"') || line.endsWith("'")) {
      env[currentKey] = currentVal.slice(1, -1); // remove surrounding quotes
      inMultiline = false;
    }
    continue;
  }

  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;

  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1);

  // Check for multiline value (starts with quote but doesn't end with one)
  if ((val.startsWith('"') && !val.endsWith('"')) || (val.startsWith("'") && !val.endsWith("'"))) {
    currentKey = key;
    currentVal = val;
    inMultiline = true;
    continue;
  }

  // Remove surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

// Assign to process.env
Object.assign(process.env, env);

const admin = require('firebase-admin');

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

async function main() {
  try {
    const customToken = await app.auth().createCustomToken('e2e-test-user');

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    );

    const data = await resp.json();
    if (data.idToken) {
      process.stdout.write(data.idToken);
    } else {
      console.error('Failed to get ID token:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await app.delete();
  }
}

main();
