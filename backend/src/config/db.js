const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      console.log('Connecting to specified MongoDB URI...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('Connected to MongoDB successfully.');
      return;
    }

    // Try standard localhost first
    try {
      console.log('Attempting connection to local MongoDB (mongodb://127.0.0.1:27017/expo_spin_win)...');
      await mongoose.connect('mongodb://127.0.0.1:27017/expo_spin_win', {
        serverSelectionTimeoutMS: 2000
      });
      console.log('Connected to local MongoDB daemon successfully.');
      return;
    } catch (localErr) {
      console.log('Local MongoDB not accessible. Starting embedded MongoDB Memory Server for production-level zero-config reliability...');
    }

    // Start in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to Embedded MongoDB Memory Server at: ${uri}`);
  } catch (error) {
    console.error('MongoDB connection failure:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
