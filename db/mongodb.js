// db/mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

// Track connection state
let dbConnection = null;

/**
 * Clean MongoDB URI by removing deprecated options
 */
const cleanMongoUri = (uri) => {
  if (!uri) return uri;
  
  // Parse the URI and remove deprecated query parameters
  const url = new URL(uri);
  const deprecatedParams = ['bufferMaxEntries', 'autoReconnect', 'reconnectTries', 'reconnectInterval'];
  
  deprecatedParams.forEach(param => {
    url.searchParams.delete(param);
  });
  
  return url.toString();
};

/**
 * Connect to MongoDB with reconnection logic
 */
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI provided:', process.env.MONGODB_URI ? 'Yes' : 'No');
    
    // Get and clean the URI
    const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017/recipeplan";
    const uri = cleanMongoUri(rawUri);
    
    // Configure Mongoose connection options for production
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority',
      // Disable deprecated options that might still be set
      useNewUrlParser: true,
      useUnifiedTopology: true
    };

    // Connect to MongoDB
    await mongoose.connect(uri, options);
    console.log("Connected to MongoDB!");
    
    // Test the connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    // Store connection reference
    dbConnection = mongoose.connection;
    
    // Set up connection event handlers
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      dbConnection = null;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      dbConnection = mongoose.connection;
    });
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.error('Connection string format check:', process.env.MONGODB_URI ? 'URI exists' : 'URI missing');
    throw error;
  }
};

/**
 * Get database connection
 */
const getDb = () => {
  if (!dbConnection || mongoose.connection.readyState !== 1) {
    throw new Error('No database connection. Call connectDB first!');
  }
  return dbConnection;
};

/**
 * Check connection status
 */
const getConnectionStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
  };
};

module.exports = { connectDB, getDb, getConnectionStatus };