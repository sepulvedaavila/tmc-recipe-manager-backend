module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const response = {
      message: 'Test API endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      environment: process.env.NODE_ENV || 'development',
      nodejs_version: process.version,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        origin: req.headers.origin
      },
      env_check: {
        mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Not set',
        node_env: process.env.NODE_ENV || 'Not set'
      }
    };
    
    console.log(`[${new Date().toISOString()}] Test endpoint called successfully`);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: 'Test endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 