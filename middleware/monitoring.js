/**
 * Monitoring and analytics middleware
 * Provides performance tracking, error monitoring, and request analytics
 */

const monitoring = {
  // Request metrics
  requestCount: 0,
  errorCount: 0,
  responseTimes: [],
  
  // Performance tracking
  startTime: Date.now(),
  
  // Get basic stats
  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    return {
      uptime: Math.floor(uptime / 1000), // seconds
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      successRate: this.requestCount > 0 
        ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      requestsPerMinute: this.requestCount > 0 
        ? Math.round((this.requestCount / (uptime / 1000)) * 60)
        : 0
    };
  }
};

// Request monitoring middleware
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  monitoring.requestCount++;
  
  // Add request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ID: ${req.requestId}`);
  
  // Monitor response
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoring.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for memory efficiency
    if (monitoring.responseTimes.length > 1000) {
      monitoring.responseTimes.shift();
    }
    
    // Track errors
    if (res.statusCode >= 400) {
      monitoring.errorCount++;
      console.error(`[ERROR] ${req.method} ${req.path} - Status: ${res.statusCode} - Time: ${responseTime}ms - ID: ${req.requestId}`);
    } else {
      console.log(`[SUCCESS] ${req.method} ${req.path} - Status: ${res.statusCode} - Time: ${responseTime}ms - ID: ${req.requestId}`);
    }
  });
  
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration.toFixed(2)}ms - ID: ${req.requestId}`);
    }
    
    // Add performance header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

// Error monitoring middleware
const errorMonitor = (err, req, res, next) => {
  monitoring.errorCount++;
  
  // Log detailed error information
  console.error(`[ERROR MONITOR] ${req.method} ${req.path} - ID: ${req.requestId}`);
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error(`User Agent: ${req.get('User-Agent')}`);
  console.error(`IP: ${req.ip || req.connection.remoteAddress}`);
  
  // Add error tracking header
  res.setHeader('X-Error-ID', req.requestId);
  
  next(err);
};

// Database performance monitoring
const dbPerformanceMonitor = (req, res, next) => {
  const mongoose = require('mongoose');
  
  // Monitor database operations
  const originalExec = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = function() {
    const startTime = Date.now();
    const query = this;
    
    return originalExec.apply(this, arguments).then(result => {
      const duration = Date.now() - startTime;
      
      // Log slow database queries (> 100ms)
      if (duration > 100) {
        console.warn(`[SLOW DB QUERY] ${duration}ms - Collection: ${query.model.collection.name} - Operation: ${query.op}`);
      }
      
      return result;
    }).catch(error => {
      const duration = Date.now() - startTime;
      console.error(`[DB ERROR] ${duration}ms - Collection: ${query.model.collection.name} - Error: ${error.message}`);
      throw error;
    });
  };
  
  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  // Log high memory usage (> 500MB)
  if (memUsageMB.heapUsed > 500) {
    console.warn(`[HIGH MEMORY] Heap used: ${memUsageMB.heapUsed}MB, Total: ${memUsageMB.heapTotal}MB`);
  }
  
  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Memory-Used', `${memUsageMB.heapUsed}MB`);
    res.setHeader('X-Memory-Total', `${memUsageMB.heapTotal}MB`);
  }
  
  next();
};

// API rate limiting simulation (basic)
const rateLimitMonitor = (req, res, next) => {
  // Simple rate limiting by IP (you might want to use a proper rate limiting library)
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Initialize rate limit tracking if not exists
  if (!req.app.locals.rateLimit) {
    req.app.locals.rateLimit = new Map();
  }
  
  const clientData = req.app.locals.rateLimit.get(clientIP) || { count: 0, resetTime: now + 60000 };
  
  // Reset counter if time window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 60000; // 1 minute window
  }
  
  clientData.count++;
  req.app.locals.rateLimit.set(clientIP, clientData);
  
  // Log high request rates (> 100 requests per minute)
  if (clientData.count > 100) {
    console.warn(`[HIGH RATE] IP: ${clientIP} - Requests: ${clientData.count}/min`);
  }
  
  next();
};

// Health check endpoint for monitoring
const healthCheck = (req, res) => {
  const stats = monitoring.getStats();
  const memUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: stats.uptime + 's',
    requests: {
      total: stats.requestCount,
      errors: stats.errorCount,
      successRate: stats.successRate,
      avgResponseTime: stats.avgResponseTime,
      requestsPerMinute: stats.requestsPerMinute
    },
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  requestMonitor,
  performanceMonitor,
  errorMonitor,
  dbPerformanceMonitor,
  memoryMonitor,
  rateLimitMonitor,
  healthCheck,
  getStats: () => monitoring.getStats()
}; 