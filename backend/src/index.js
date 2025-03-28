// backend/src/index.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const { connectMongoDB, connectRedis, isMongoFallbackMode } = require('./config/database');
const routes = require('./routes');
const { limiter, validateInput, errorHandler } = require('./middleware/security');
const setupMongoFallbacks = require('./utils/mongoFallback');
const mistralController = require('./controllers/mistralController');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const initializePassport = require('./config/passportConfig');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();


// Initialize passport for authentication
const passportInstance = initializePassport()

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configurazione sicura di Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: false // Necessario per risolvere CORB
}));

// Configurazione CORS sicura
const whitelist = process.env.CORS_WHITELIST ?
    process.env.CORS_WHITELIST.split(',') :
    ['https://villapetriolo.it', 'http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // In development, accept requests with no origin (like curl/postman)
    if (whitelist.includes(origin) || !origin || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Non permesso da CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Session-ID', 'X-User-ID', 'Accept', 'Origin', 'Authorization'],
  exposedHeaders: ['Content-Type', 'X-Session-ID'],
  credentials: true
}));

// Parse request bodies before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aggiungi questi middleware dopo le configurazioni CORS:
app.use(cookieParser()); // Per gestire i cookie
app.use(passport.initialize());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Ping endpoint for connection testing
app.post('/ping', (req, res) => {
    console.log('Ping received:', req.body);
    res.json({
        status: 'ok',
        message: 'pong',
        received: req.body,
        time: new Date().toISOString()
    });
});

// Direct route for chat message
app.post('/chat/message', (req, res) => {
    console.log('Direct chat route hit:', req.body);
    mistralController.chat(req, res);
});

// Test endpoint that doesn't use any service
app.post('/test/message', (req, res) => {
    console.log('Test endpoint hit:', req.body);
    const { message } = req.body;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'test-session';
    
    res.json({
        message: `Echo: ${message || 'No message provided'}`,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
    });
});

// Rate limiting
app.use(limiter);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Apply API routes with validation
app.use('/api', validateInput);
app.use('/api', routes);
app.use('/api/auth', authRoutes);

// Root route for health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Villa Petriolo Backend API is running',
        version: '1.0.0',
        mode: isMongoFallbackMode ? 'fallback (in-memory)' : 'normal',
        features: ['chat', 'bookings', 'restaurant', 'events']
    });
});

// Special routes for GSAP and its plugins with proper MIME types
app.use('/gsap', express.static(path.join(__dirname, '../node_modules/gsap'), {
    setHeaders: (res, filePath) => {
      // Set appropriate MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Allow cross-origin requests for this specific resource
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Ensure cache control is set
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
}));

// Error handling middleware
app.use(errorHandler);

// Global error handler for unhandled errors
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'Si è verificato un errore interno. Riprova più tardi.'
    });
});

// Initialize and start the application
const startServer = async () => {
    try {
        // Connect to databases with fallbacks - don't throw if they fail
        let mongoConnected = false;
        let redisConnected = false;
        
        try {
            mongoConnected = await connectMongoDB();
        } catch (mongoError) {
            console.error('MongoDB connection error, using fallback:', mongoError);
        }
        
        try {
            redisConnected = await connectRedis();
        } catch (redisError) {
            console.error('Redis connection error, using fallback:', redisError);
        }
        
        // Setup MongoDB fallbacks if needed
        setupMongoFallbacks();
        
        // Start the server regardless of connection outcomes
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database status: MongoDB ${mongoConnected ? 'connected' : 'fallback'}, Redis ${redisConnected ? 'connected' : 'fallback'}`);
            console.log('Villa Petriolo backend initialized successfully');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        
        // Try emergency server as last resort
        try {
            const emergencyApp = express();
            emergencyApp.use(express.json());
            
            // Usa CORS sicuro anche per il server di emergenza
            emergencyApp.use(cors({
              origin: whitelist,
              methods: ['GET', 'POST'],
              credentials: true
            }));
            
            // Basic routes for emergency server
            emergencyApp.get('/', (req, res) => res.json({ status: 'emergency' }));
            emergencyApp.post('/chat/message', (req, res) => {
                res.json({ 
                    message: "Server in modalità di emergenza. Funzionalità limitata.",
                    sessionId: req.headers['x-session-id'] || 'emergency'
                });
            });
            
            emergencyApp.listen(PORT, () => {
                console.log(`EMERGENCY: Server running on port ${PORT}`);
            });
        } catch (emergencyError) {
            console.error('FATAL: Failed to start emergency server:', emergencyError);
            process.exit(1);
        }
    }
};

// Start the server
startServer();

// Error handlers for uncaught errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

module.exports = app;