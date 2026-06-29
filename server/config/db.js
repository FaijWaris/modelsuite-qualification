const mongoose = require('mongoose');
const seedDatabase = require('./seedHelper');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // Fail fast in 2 seconds if MongoDB is down
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MONGO_URI: ${error.message}`);
    console.log('Attempting to start an in-memory MongoDB server fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB In-Memory Connected: ${conn.connection.host}`);
      
      // Auto-seed the freshly created in-memory database
      await seedDatabase();

      // Store server instance globally to clean up on exit
      global.__MONGO_SERVER__ = mongoServer;

      // Handle termination signals to cleanly stop the in-memory mongo server
      const cleanup = async () => {
        if (global.__MONGO_SERVER__) {
          await global.__MONGO_SERVER__.stop();
        }
        process.exit(0);
      };
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    } catch (inMemError) {
      console.error(`In-Memory MongoDB failed to start: ${inMemError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
