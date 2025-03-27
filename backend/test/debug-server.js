console.log('Starting debug server...');

try {
  // Basic imports
  console.log('Loading basic modules...');
  const express = require('express');
  const path = require('path');
  console.log('Basic modules loaded');

  // Try loading database modules
  console.log('Loading database modules...');
  let database;
  try {
    database = require('../src/config/database');
    console.log('Database modules loaded');
  } catch (dbError) {
    console.error('Failed to load database modules:', dbError);
    // Continue without database
    database = {
      connectMongoDB: async () => console.log('Mock MongoDB connect'),
      connectRedis: async () => console.log('Mock Redis connect')
    };
  }

  // Create Express app
  const app = express();
  const PORT = 3001;
  console.log('Express app created');

  // Simple middleware
  app.use(express.json());
  console.log('JSON middleware applied');

  // Routes
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Debug server is running' });
  });

  app.post('/chat/message', (req, res) => {
    console.log('Received chat message:', req.body);
    res.json({ 
      message: 'Test response from debug server',
      sessionId: req.headers['x-session-id'] || 'test-session'
    });
  });

  console.log('Routes configured');

  // Start server with safe async handling
  const startServer = async () => {
    try {
      // Try database connections with explicit error handling
      if (database.connectMongoDB) {
        try {
          console.log('Attempting MongoDB connection...');
          await database.connectMongoDB();
          console.log('MongoDB connected successfully');
        } catch (mongoError) {
          console.error('MongoDB connection failed:', mongoError);
        }
      }
      
      if (database.connectRedis) {
        try {
          console.log('Attempting Redis connection...');
          await database.connectRedis();
          console.log('Redis connected successfully');
        } catch (redisError) {
          console.error('Redis connection failed:', redisError);
        }
      }
      
      // Start listening
      app.listen(PORT, () => {
        console.log(`Debug server running on port ${PORT}`);
      });
    } catch (startupError) {
      console.error('Server startup error:', startupError);
    }
  };

  // Call start with explicit error handling
  console.log('About to start server...');
  startServer().catch(err => {
    console.error('Unhandled startup error:', err);
  });

} catch (globalError) {
  console.error('Fatal error during initialization:', globalError);
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('Debug server script completed');