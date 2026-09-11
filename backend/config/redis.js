const { createClient } = require('redis');

const REDIS_URI = process.env.REDIS_URI || 'redis://redis:6379';

let redisClient = null;
let isRedisConnected = false;

const initRedis = async () => {
  try {
    redisClient = createClient({
      url: REDIS_URI,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.log('⚠️ Redis reconnect attempts exhausted. Running without Redis cache.');
            return false;
          }
          return Math.min(retries * 500, 2000);
        }
      }
    });

    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        console.warn('⚠️ Redis error:', err.message);
      }
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('✅ Redis Cache connected successfully!');
    });

    await redisClient.connect();
  } catch (err) {
    console.log('ℹ️ Redis unavailable. Continuing with direct database queries.');
    isRedisConnected = false;
  }
};

// Helper: Get cached JSON
const getCachedData = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

// Helper: Set cached JSON with TTL (seconds)
const setCachedData = async (key, value, ttlSeconds = 60) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    // Ignore cache set errors
  }
};

// Helper: Delete cached key
const deleteCachedData = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    // Ignore cache delete errors
  }
};

module.exports = {
  initRedis,
  getCachedData,
  setCachedData,
  deleteCachedData,
  isRedisConnected: () => isRedisConnected
};
