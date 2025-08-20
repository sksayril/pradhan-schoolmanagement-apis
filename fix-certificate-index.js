const mongoose = require('mongoose');
require('dotenv').config();

async function fixCertificateIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('DATABASE_URL or MONGODB_URI environment variable is required');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get the database instance
    const db = mongoose.connection.db;
    const collection = db.collection('students');

    // Drop the existing problematic index
    try {
      await collection.dropIndex('certificates.certificateNumber_1');
      console.log('Dropped existing certificate index');
    } catch (error) {
      console.log('Index might not exist or already dropped:', error.message);
    }

    // Create the new sparse index
    await collection.createIndex(
      { 'certificates.certificateNumber': 1 },
      { 
        unique: true, 
        sparse: true
      }
    );
    console.log('Created new sparse certificate index');

    console.log('Certificate index fix completed successfully');
  } catch (error) {
    console.error('Error fixing certificate index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixCertificateIndex(); 