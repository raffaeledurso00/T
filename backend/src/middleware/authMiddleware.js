// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const authConfig = require('../config/authConfig');

// Middleware per verificare il token JWT
const authenticateJWT = (req, res, next) => {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        // Formato: "Bearer TOKEN"
        const token = authHeader.split(' ')[1];
        
        jwt.verify(token, authConfig.jwt.secret, (err, user) => {
            if (err) {
                return res.status(403).json({
                    error: 'Token non valido',
                    message: 'Autenticazione fallita',
                    details: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }
            
            // Salva l'ID utente nella richiesta per l'uso nei controller
            req.userId = user.id;
            // Salva anche i dati utente completi se necessari
            req.user = user;
            
            // Imposta l'header X-User-ID per i servizi interni
            req.headers['x-user-id'] = user.id;
            
            next();
        });
    } else {
        res.status(401).json({
            error: 'Token mancante',
            message: 'Autenticazione richiesta'
        });
    }
};

// Middleware per verificare se l'utente è un admin
const requireAdmin = (req, res, next) => {
    // Prima verifica che l'utente sia autenticato
    if (!req.user || !req.userId) {
        return res.status(401).json({
            error: 'Non autenticato',
            message: 'Autenticazione richiesta'
        });
    }
    
    // Verifica il ruolo dell'utente
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Accesso negato',
            message: 'Richiesti privilegi di amministratore'
        });
    }
    
    next();
};

// Middleware opzionale che non blocca le richieste non autenticate
// ma aggiunge le informazioni dell'utente se autenticato
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return next(); // Continua senza autenticazione
    }
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, authConfig.jwt.secret, (err, user) => {
        if (!err) {
            // Utente autenticato
            req.userId = user.id;
            req.user = user;
            req.headers['x-user-id'] = user.id;
        }
        // Continua comunque, anche in caso di errore
        next();
    });
};

module.exports = {
    authenticateJWT,
    requireAdmin,
    optionalAuth
};