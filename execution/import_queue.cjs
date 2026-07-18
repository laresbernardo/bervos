const fs = require('fs');
const path = require('path');
const os = require('os');
const { Firestore } = require('@google-cloud/firestore');
const { OAuth2Client } = require('google-auth-library');

const queuePath = path.join(__dirname, '../social/bervos_social_queue.json');
const posts = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

async function importQueue() {
  const cliConfigPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  if (!fs.existsSync(cliConfigPath)) {
    throw new Error('Firebase CLI config file not found. Please run firebase login.');
  }

  const cliConfig = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'));
  const refreshToken = cliConfig.tokens?.refresh_token;
  if (!refreshToken) {
    throw new Error('No refresh token found in Firebase CLI config. Please run firebase login.');
  }

  // Use Firebase CLI client ID for authentication
  const clientId = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
  const auth = new OAuth2Client({
    clientId: clientId
  });
  
  auth.setCredentials({
    refresh_token: refreshToken
  });

  const db = new Firestore({
    projectId: 'bervos-official',
    authClient: auth
  });

  console.log(`Starting import of ${posts.length} posts...`);
  for (const post of posts) {
    const docRef = db.collection('social_posts').doc(post.id);
    await docRef.set(post);
    console.log(`Imported: ${post.id}`);
  }
  console.log('Import completed successfully!');
}

importQueue().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
