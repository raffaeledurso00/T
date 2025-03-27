// backend/src/index.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const { connectMongoDB, connectRedis, isMongoFallbackMode } = require('./config/database');
const routes = require('./routes');
const { limiter, validateInput, errorHandler } = require('./middleware/security');
const setupMongoFallbacks = require('./utils/mongoFallback');
const mistralController = require('./controllers/mistralController');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Handle OPTIONS requests explicitly for CORS preflight
app.options('*', cors());

// CORS configuration - very permissive for development
app.use(cors({
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-ID', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'X-Session-ID'],
  credentials: true
}));

// Parse request bodies before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Add response headers for CORS and security
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Session-ID");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

// Root route for health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Villa Petriolo Backend API is running',
        version: '1.0.0',
        mode: isMongoFallbackMode ? 'fallback (in-memory)' : 'normal'
    });
});

// Special routes for GSAP and its plugins with proper MIME types
app.use('/gsap', express.static(path.join(__dirname, '../node_modules/gsap')));
app.get('/gsap/DrawSVGPlugin.min.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../node_modules/gsap/DrawSVGPlugin.min.js'));
});

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
            emergencyApp.use(cors());
            
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