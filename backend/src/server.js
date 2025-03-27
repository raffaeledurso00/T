const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { connectMongoDB, connectRedis } = require('./config/database');
const chatRoutes = require('./routes/chatRoutes');
const openAIService = require('./services/ai/OpenAIService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS options
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Session-ID'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(morgan('dev'));

// Custom request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Initialize database connections
const initializeApp = async () => {
    try {
        await connectMongoDB();
        await connectRedis();
        
        // Start periodic cleanup of old conversations
        setInterval(() => {
            openAIService.cleanupOldConversations();
        }, 3600000); // Every hour

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Knowledge base loaded, concierge ready to assist');
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

initializeApp();