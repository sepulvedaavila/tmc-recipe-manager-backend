const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const healthData = {
      status: 'OK',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodejs_version: process.version,
      platform: process.platform
    };
    
    // Check MongoDB connection
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        healthData.database = { status: 'ERROR', message: 'MONGODB_URI not set' };
      } else {
        healthData.database = { 
          status: 'URI_SET', 
          connection_state: mongoose.connection.readyState,
          connection_states: {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
          }
        };
      }
    } catch (error) {
      healthData.database = { status: 'ERROR', error: error.message };
    }
    
    return res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 