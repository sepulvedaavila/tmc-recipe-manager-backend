const mongoose = require('mongoose');

module.exports = async (req, res) => {
  // Set CORS headers for all origins during health check
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
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
      platform: process.platform,
      cors: {
        origin: origin || 'no-origin',
        allowed: true
      }
    };
    
    // Check MongoDB connection (but don't fail if it's not available)
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        healthData.database = { 
          status: 'WARNING', 
          message: 'MONGODB_URI not set',
          connection_state: 'unknown'
        };
      } else {
        const connectionState = mongoose.connection.readyState;
        const states = {
          0: 'disconnected',
          1: 'connected', 
          2: 'connecting',
          3: 'disconnecting'
        };
        
        healthData.database = { 
          status: connectionState === 1 ? 'OK' : 'WARNING',
          connection_state: states[connectionState] || 'unknown',
          connection_states: states
        };
        
        // Only try to ping if connected
        if (connectionState === 1) {
          try {
            await mongoose.connection.db.admin().command({ ping: 1 });
            healthData.database.ping = 'success';
          } catch (pingError) {
            healthData.database.ping = 'failed';
            healthData.database.ping_error = pingError.message;
          }
        }
      }
    } catch (error) {
      healthData.database = { 
        status: 'ERROR', 
        error: error.message,
        connection_state: 'error'
      };
    }
    
    // Set appropriate status code
    const statusCode = healthData.database?.status === 'OK' ? 200 : 200; // Always return 200 for health check
    
    return res.status(statusCode).json(healthData);
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