const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...\n');
  
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }
  
  console.log('📝 Connection URI (hidden password):');
  console.log(uri.replace(/:[^:@]+@/, ':****@'));
  console.log('');
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB!\n');
    
    const db = client.db();
    console.log(`📊 Database name: ${db.databaseName}`);
    
    // Test a simple operation
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None yet'}\n`);
    
    console.log('✅ Connection test PASSED!\n');
    
  } catch (error) {
    console.error('❌ Connection FAILED!\n');
    console.error('Error:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Go to MongoDB Atlas → Network Access');
    console.error('2. Click "Add IP Address"');
    console.error('3. Click "Allow Access from Anywhere" (0.0.0.0/0) for testing');
    console.error('4. Wait 1-2 minutes for changes to apply');
    console.error('5. Re-run this test: node scripts/test-connection.js\n');
    
    if (error.message.includes('SSL') || error.message.includes('authentication')) {
      console.error('📌 This looks like an IP whitelist or authentication issue.');
      console.error('📌 Most common cause: Your IP is not whitelisted in MongoDB Atlas\n');
    }
    
  } finally {
    await client.close();
    process.exit(0);
  }
}

testConnection();
