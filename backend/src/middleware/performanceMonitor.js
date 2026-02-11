const { performance } = require('perf_hooks');

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = performance.now();
  
  // Create a performance entry
  const perfEntry = performance.mark('request-start');
  
  // Override res.end to measure performance
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const end = performance.now();
    const duration = end - start;
    
    // Log performance metrics
    console.log(`🚀 Performance - ${req.method} ${req.originalUrl}: ${duration.toFixed(2)}ms`);
    
    // Log slow requests (>1s)
    if (duration > 1000) {
      console.warn(`⚠️  Slow Request: ${req.method} ${req.originalUrl} took ${duration.toFixed(2)}ms`);
    }
    
    // Add performance headers
    res.set('X-Response-Time', duration.toFixed(2));
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage every 100 requests
  if (global.requestCount === undefined) {
    global.requestCount = 0;
  }
  global.requestCount++;
  
  if (global.requestCount % 100 === 0) {
    console.log(`📊 Memory Usage: RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    
    // Alert if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn(`⚠️  High Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }
  
  next();
};

// Database query monitoring
const queryMonitor = (req, res, next) => {
  const originalQuery = require('../config/database').query;
  
  // Override query method to add logging
  require('../config/database').query = async (sql, params) => {
    const start = Date.now();
    try {
      const result = await originalQuery(sql, params);
      const duration = Date.now() - start;
      
      // Log slow queries (>100ms)
      if (duration > 100) {
        console.warn(`⚠️  Slow Query (${duration}ms):`, sql.substring(0, 100) + '...');
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Query Error:`, sql.substring(0, 100) + '...', error.message);
      throw error;
    }
  };
  
  next();
};

// API response time monitoring
const responseTimeMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log response time
    console.log(`⏱️  Response Time: ${req.method} ${req.originalUrl}: ${duration}ms`);
    
    // Log slow responses (>2s)
    if (duration > 2000) {
      console.warn(`⚠️  Slow Response: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  performanceMonitor,
  memoryMonitor,
  queryMonitor,
  responseTimeMonitor
};
