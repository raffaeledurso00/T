// backend/src/middleware/security.js
const rateLimit = require('express-rate-limit');

// Rate limiting - relaxed for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increase limit for development
    message: 'Troppe richieste da questo IP, riprova tra 15 minuti',
    standardHeaders: true,
    legacyHeaders: false,
});

// Input validation middleware - simplified
const validateInput = (req, res, next) => {
    if (req.method === 'POST' && req.path.includes('/chat/message')) {
        const { message } = req.body;
        
        if (!message) {
            console.log('Validation failed: message is missing');
            return res.status(400).json({ error: 'Messaggio non valido' });
        }
    }
    
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error handler caught:', err);
    
    // Simplified error response
    res.status(500).json({
        error: 'Errore interno del server',
        message: err.message
    });
};

module.exports = {
    limiter,
    validateInput,
    errorHandler
};