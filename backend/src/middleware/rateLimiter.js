const rateLimit = require('express-rate-limit');
const Redis = require('redis');

// Redis client for distributed rate limiting
let redisClient;

if (process.env.REDIS_HOST) {
  redisClient = require('redis').createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redisClient.connect();
}

// Create Redis store for rate limiting
const RedisStore = {
  async increment(key) {
    if (!redisClient) return Promise.resolve(0);
    
    try {
      const result = await redisClient.incr(key);
      await redisClient.expire(key, 60); // 1 minute expiry
      return result;
    } catch (error) {
      console.error('Redis increment error:', error);
      return Promise.resolve(0);
    }
  },

  async decrement(key) {
    if (!redisClient) return Promise.resolve();
    try {
      await redisClient.decr(key);
    } catch (error) {
      console.error('Redis decrement error:', error);
    }
  }
};

// Rate limiters for different endpoints
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient ? RedisStore : undefined,
    keyGenerator: (req) => {
      return req.ip + ':' + (req.user?.id || 'anonymous') + ':' + (req.path || 'unknown');
    },
    skip: (req) => {
      // Skip rate limiting for trusted IPs or internal requests in development
      const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
      const isTrustedIP = trustedIPs.includes(req.ip) || 
                         trustedIPs.includes(req.hostname) ||
                         process.env.NODE_ENV === 'development';
      return isTrustedIP;
    }
  });
};

// Specific rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 attempts in dev, 5 in prod
  message: 'Too many authentication attempts, please try again later.'
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later.'
});

const jobCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 jobs per hour
  message: 'Too many job postings, please try again later.'
});

const applicationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 applications per hour
  message: 'Too many applications, please try again later.'
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: 'API rate limit exceeded, please try again later.'
});

module.exports = {
  authLimiter,
  uploadLimiter,
  jobCreationLimiter,
  applicationLimiter,
  apiLimiter,
  createRateLimiter
};
