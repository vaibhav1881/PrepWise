import clientPromise from '../lib/mongodb';

async function setupDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Create unique index on email field
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );

    console.log('✅ Database setup complete!');
    console.log('✅ Created unique index on email field');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
