// src/config/database.js
const mongoose = require('mongoose');
const Redis = require('ioredis');

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/villa-petriolo';

// Redis Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// In-memory fallback for Redis
class RedisFallback {
    constructor() {
        this.store = new Map();
        console.warn('Using in-memory fallback for Redis');
    }

    async set(key, value, expiryMode, expiry) {
        this.store.set(key, value);
        
        // Handle expiry if specified
        if (expiryMode === 'EX' && expiry) {
            setTimeout(() => {
                this.store.delete(key);
            }, expiry * 1000); // Convert seconds to milliseconds
        }
        
        return 'OK';
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async del(...keys) {
        for (const key of keys) {
            this.store.delete(key);
        }
        return keys.length;
    }

    async ping() {
        return 'PONG';
    }
    
    on(event, callback) {
        // Simulate 'connect' event immediately
        if (event === 'connect') {
            setTimeout(callback, 0);
        }
        return this;
    }
}

// MongoDB Connection with fallback
let isMongoFallbackMode = false;
const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Using in-memory database fallback mode');
        isMongoFallbackMode = true;
        return false;
    }
};

// Redis Connection with fallback
let redisClient = new RedisFallback(); // Start with fallback immediately
let isRedisFallbackMode = true;        // Default to fallback mode

const connectRedis = async () => {
    try {
        // Create Redis client with timeout options
        const tempClient = new Redis(REDIS_URL, {
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // Disable retries
        });
        
        // Test connection with timeout
        const pingPromise = tempClient.ping().then(() => true);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
        });
        
        await Promise.race([pingPromise, timeoutPromise]);
        
        // If we get here, connection was successful
        redisClient = tempClient;
        isRedisFallbackMode = false;
        console.log('Redis connected successfully');
        return true;
    } catch (error) {
        console.error('Redis connection error:', error);
        console.log('Using in-memory Redis fallback');
        
        // Use fallback if connection fails
        redisClient = new RedisFallback();
        isRedisFallbackMode = true;
        return false;
    }
};

module.exports = {
    connectMongoDB,
    connectRedis,
    redisClient,
    isRedisFallbackMode,
    isMongoFallbackMode
};