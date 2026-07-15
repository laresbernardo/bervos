const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin using local credentials
admin.initializeApp({
  projectId: 'bervos-official'
});

const db = admin.firestore();

const queuePath = path.join(__dirname, '../social/bervos_social_queue.json');
const posts = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

async function importQueue() {
  console.log(`Starting import of ${posts.length} posts...`);
  for (const post of posts) {
    await db.collection('social_posts').doc(post.id).set(post);
    console.log(`Imported: ${post.id}`);
  }
  console.log('Import completed successfully!');
}

importQueue().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
