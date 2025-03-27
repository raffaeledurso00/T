const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Minimal middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Simple chat endpoint
app.post('/chat/message', (req, res) => {
    console.log('Chat endpoint hit:', req.body);
    res.json({
        message: "This is a test response from the simplified server",
        sessionId: req.headers['x-session-id'] || 'test-session'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Simplified Villa Petriolo Backend API is running'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Simplified server running on port ${PORT}`);
});