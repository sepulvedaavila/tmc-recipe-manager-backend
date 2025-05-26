/**
 * Middleware to log all API requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request method and URL
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log request body for POST/PUT/PATCH methods
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} completed in ${duration}ms with status ${res.statusCode}`);
    
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = requestLogger;