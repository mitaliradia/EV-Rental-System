import Redis from 'ioredis';

// Beginner friendly explanation:
// We read the REDIS_URL from environmental variables. If not defined, we try to connect to localhost on default port 6379.
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisClient = null;
let useRedis = false;

// 1. Local In-Memory Fallback Cache
// If the user does not have Redis installed or running locally, we don't want the app to crash.
// We implement a simple JavaScript Map to store key-value pairs with Expiry (TTL).
const memoryCache = new Map();

const localCache = {
    get: (key) => {
        const item = memoryCache.get(key);
        if (!item) return null;
        
        // Check if the item has expired
        if (Date.now() > item.expiry) {
            memoryCache.delete(key); // Evict expired key
            return null;
        }
        
        try {
            return JSON.parse(item.value);
        } catch (e) {
            return item.value;
        }
    },
    set: (key, value, ttlSeconds = 3600) => {
        const expiry = Date.now() + (ttlSeconds * 1000);
        memoryCache.set(key, {
            value: JSON.stringify(value),
            expiry
        });
    },
    del: (key) => {
        memoryCache.delete(key);
    },
    clear: () => {
        memoryCache.clear();
    }
};

// 2. Initialize Redis connection
try {
    // We set maxReconnectionAttempts low so it quickly falls back to memory cache if Redis is not running.
    redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000, // 2 seconds timeout to detect offline status
        reconnectOnError: () => false,
        retryStrategy: (times) => {
            if (times > 2) {
                console.warn('⚠️ Redis connection failed. Falling back to local in-memory caching.');
                useRedis = false;
                return null; // Stop retrying
            }
            return 1000; // Retry after 1 second
        }
    });

    redisClient.on('connect', () => {
        console.log('🚀 Redis cache connected successfully!');
        useRedis = true;
    });

    redisClient.on('error', (err) => {
        // If Redis is offline, ioredis will emit error events. We catch them here.
        if (!useRedis) {
            // Quietly ignore connection errors if we've already fallen back to local cache
            return;
        }
        console.warn('⚠️ Redis Error detected. Switching to local in-memory fallback cache.', err.message);
        useRedis = false;
    });

} catch (error) {
    console.warn('⚠️ Failed to initialize Redis client. Falling back to local cache.', error.message);
    useRedis = false;
}

// 3. Exported Caching Service Functions
export const cacheService = {
    /**
     * Get a value from the cache
     * @param {string} key - Cache key
     */
    get: async (key) => {
        if (useRedis && redisClient) {
            try {
                const data = await redisClient.get(key);
                if (!data) return null;
                return JSON.parse(data);
            } catch (err) {
                console.error(`Failed to get cache key: ${key}. Falling back to local cache.`, err.message);
                return localCache.get(key);
            }
        }
        return localCache.get(key);
    },

    /**
     * Store a value in the cache with a time-to-live (TTL)
     * @param {string} key - Cache key
     * @param {any} value - Cache value (will be serialized to JSON string)
     * @param {number} ttlSeconds - Time-To-Live in seconds (default: 1 hour)
     */
    set: async (key, value, ttlSeconds = 3600) => {
        if (useRedis && redisClient) {
            try {
                const serializedValue = JSON.stringify(value);
                await redisClient.set(key, serializedValue, 'EX', ttlSeconds);
                return;
            } catch (err) {
                console.error(`Failed to set cache key: ${key}. Falling back to local cache.`, err.message);
                localCache.set(key, value, ttlSeconds);
            }
        } else {
            localCache.set(key, value, ttlSeconds);
        }
    },

    /**
     * Delete a value from the cache (Cache Invalidation)
     * @param {string} key - Cache key
     */
    del: async (key) => {
        if (useRedis && redisClient) {
            try {
                await redisClient.del(key);
                return;
            } catch (err) {
                console.error(`Failed to delete cache key: ${key}. Falling back to local cache.`, err.message);
                localCache.del(key);
            }
        } else {
            localCache.del(key);
        }
    },

    /**
     * Clear all keys in memory (useful during seeding/testing)
     */
    clear: async () => {
        if (useRedis && redisClient) {
            try {
                await redisClient.flushall();
                return;
            } catch (err) {
                console.error('Failed to flush Redis keys. Clearing local cache.', err.message);
                localCache.clear();
            }
        } else {
            localCache.clear();
        }
    }
};
