// backend/src/config/passportConfig.js
const passport = require('passport');
const googleAuthService = require('../services/auth/googleAuthService');

// Configurazione per passport
const initializePassport = () => {
    // Configura l'autenticazione Google
    googleAuthService.initialize();
    
    // Serializzazione e deserializzazione dell'utente
    // Necessarie anche se non usiamo sessioni complete
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
        // Non implementiamo la deserializzazione completa perché usiamo JWT
        done(null, { id });
    });
    
    console.log('Passport inizializzato con successo');
    
    return passport;
};

module.exports = initializePassport;