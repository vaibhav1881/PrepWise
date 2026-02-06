// Run this once to set up your MongoDB indexes
// Usage: node scripts/setup-db.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();

    console.log('🔗 Connected to MongoDB');

    // Create unique index on email field
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );

    console.log('✅ Database setup complete!');
    console.log('✅ Created unique index on email field');
    console.log('\n📊 Your users collection is ready to use!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

setupDatabase();
