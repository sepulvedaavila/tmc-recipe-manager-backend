const mongoose = require('mongoose');
const { connectDB } = require('../db/mongodb');

/**
 * Middleware to ensure database connection before processing requests
 * Optimized for Vercel serverless environment
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
      try {
        await connectDB();
      } catch (connectError) {
        console.error('Database connection failed:', connectError);
        // In production, return a graceful error instead of crashing
        return res.status(503).json({
          success: false,
          message: 'Database service temporarily unavailable',
          error: process.env.NODE_ENV === 'development' ? connectError.message : 'Service error'
        });
      }
    }
    
    // Wait for connection to be established (with timeout)
    if (mongoose.connection.readyState === 2) {
      console.log('Database connecting. Waiting for connection...');
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Database connection timeout'));
          }, 8000); // 8 second timeout for serverless

          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          mongoose.connection.once('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      } catch (waitError) {
        console.error('Database connection wait failed:', waitError);
        return res.status(503).json({
          success: false,
          message: 'Database connection timeout',
          error: process.env.NODE_ENV === 'development' ? waitError.message : 'Service timeout'
        });
      }
    }
    
    // Verify connection is established
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    throw new Error('Database connection failed');
    
  } catch (error) {
    console.error('Database middleware error:', error);
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service error'
    });
  }
};

module.exports = { ensureDbConnection }; 