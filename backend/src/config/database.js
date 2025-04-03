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

// Stato globale delle connessioni
let isMongoFallbackMode = false;
let isRedisFallbackMode = false;
let redisClient = new RedisFallback(); // Start with fallback by default
let mongoConnectionAttempts = 0;
let redisConnectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// MongoDB Connection with retry and fallback
const connectMongoDB = async (retryOnFailure = true) => {
    try {
        if (mongoConnectionAttempts >= MAX_CONNECTION_ATTEMPTS && retryOnFailure) {
            console.log(`Maximum MongoDB connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached, using fallback mode`);
            isMongoFallbackMode = true;
            return false;
        }

        mongoConnectionAttempts++;
        console.log(`MongoDB connection attempt ${mongoConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            connectTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true,
            retryReads: true
        });
        
        console.log('MongoDB connected successfully');
        
        // Setup connection health check
        setupMongoHealthCheck();
        
        // Reset connection attempts counter
        mongoConnectionAttempts = 0;
        isMongoFallbackMode = false;
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        
        if (retryOnFailure && mongoConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            console.log(`Retrying MongoDB connection in 5 seconds... (attempt ${mongoConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectMongoDB(retryOnFailure);
        }
        
        console.log('Using in-memory database fallback mode');
        isMongoFallbackMode = true;
        return false;
    }
};

// Redis Connection with retry and fallback
const connectRedis = async (retryOnFailure = true) => {
    try {
        if (redisConnectionAttempts >= MAX_CONNECTION_ATTEMPTS && retryOnFailure) {
            console.log(`Maximum Redis connection attempts (${MAX_CONNECTION_ATTEMPTS}) reached, using fallback mode`);
            isRedisFallbackMode = true;
            redisClient = new RedisFallback();
            return false;
        }

        redisConnectionAttempts++;
        console.log(`Redis connection attempt ${redisConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
        
        // Create Redis client with timeout options
        const tempClient = new Redis(REDIS_URL, {
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            retryStrategy: () => {
                if (redisConnectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
                    return null; // Stop retrying after max attempts
                }
                return 5000; // Retry after 5 seconds
            }
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
        
        // Setup connection health check
        setupRedisHealthCheck();
        
        // Reset connection attempts counter
        redisConnectionAttempts = 0;
        
        console.log('Redis connected successfully');
        return true;
    } catch (error) {
        console.error('Redis connection error:', error);
        
        if (retryOnFailure && redisConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            console.log(`Retrying Redis connection in 5 seconds... (attempt ${redisConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectRedis(retryOnFailure);
        }
        
        console.log('Using in-memory Redis fallback');
        
        // Use fallback if connection fails
        redisClient = new RedisFallback();
        isRedisFallbackMode = true;
        return false;
    }
};

// Funzione per verificare periodicamente la salute della connessione MongoDB
function setupMongoHealthCheck() {
    const interval = setInterval(async () => {
        try {
            // Verifica lo stato della connessione
            if (mongoose.connection.readyState !== 1) { // 1 = connected
                console.warn('MongoDB connection lost, attempting to reconnect...');
                clearInterval(interval); // Stop current health check
                
                // Try to reconnect
                isMongoFallbackMode = true; // Use fallback while reconnecting
                mongoConnectionAttempts = 0; // Reset attempts counter
                await connectMongoDB();
            }
        } catch (error) {
            console.error('Error in MongoDB health check:', error);
        }
    }, 30000); // Check every 30 seconds
    
    // Clean up on process exit
    process.on('SIGINT', () => {
        clearInterval(interval);
        mongoose.connection.close();
    });
}

// Funzione per verificare periodicamente la salute della connessione Redis
function setupRedisHealthCheck() {
    const interval = setInterval(async () => {
        try {
            // Try ping to verify connection
            await redisClient.ping();
        } catch (error) {
            console.warn('Redis connection lost, attempting to reconnect...');
            clearInterval(interval); // Stop current health check
            
            // Try to reconnect
            isRedisFallbackMode = true; // Use fallback while reconnecting
            redisConnectionAttempts = 0; // Reset attempts counter
            await connectRedis();
        }
    }, 30000); // Check every 30 seconds
    
    // Clean up on process exit
    process.on('SIGINT', () => {
        clearInterval(interval);
        redisClient.quit();
    });
}

module.exports = {
    connectMongoDB,
    connectRedis,
    redisClient,
    isRedisFallbackMode,
    isMongoFallbackMode
};