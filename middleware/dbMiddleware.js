const mongoose = require('mongoose');
const { connectDB } = require('../db/mongodb');

/**
 * Middleware to ensure database connection before processing requests
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    // If not connected, attempt to connect
    if (mongoose.connection.readyState === 0) {
      console.log('Database not connected. Attempting to connect...');
      await connectDB();
    }
    
    // Wait for connection to be established
    if (mongoose.connection.readyState === 2) {
      console.log('Database connecting. Waiting for connection...');
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
    }
    
    // Verify connection is established
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    throw new Error('Database connection failed');
    
  } catch (error) {
    console.error('Database middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
};

module.exports = { ensureDbConnection }; 