// src/emergency-index.js
// This is a minimal server implementation that doesn't rely on database connections
// Use this by renaming to index.js if your original server is crashing

const express = require('express');
const cors = require('cors');
const mistralController = require('./controllers/mistralController');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Simple cors handling
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Session-ID', 'Accept', 'Origin'],
}));

// Handle OPTIONS requests
app.options('*', cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check route
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Villa Petriolo Backend API is running in emergency mode',
        version: '1.0.0'
    });
});

// Direct chat routes
app.post('/chat/message', (req, res) => {
    console.log('Chat endpoint hit:', req.body);
    mistralController.chat(req, res);
});

app.post('/api/chat/message', (req, res) => {
    console.log('API chat endpoint hit:', req.body);
    mistralController.chat(req, res);
});

app.post('/api/chat/clear-history', (req, res) => {
    mistralController.clearHistory(req, res);
});

app.post('/api/chat/init', (req, res) => {
    mistralController.initSession(req, res);
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Si è verificato un errore interno. Riprova più tardi.'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Emergency server running on port ${PORT}`);
    console.log('Note: This is running in emergency mode without database connections');
});

// Error handlers for uncaught exceptions
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

module.exports = app;