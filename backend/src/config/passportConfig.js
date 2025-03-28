// backend/src/config/passportConfig.js
const passport = require('passport');
const googleAuthService = require('../services/auth/googleAuthService');

// Configurazione per passport
const initializePassport = () => {
    // Verifica se le configurazioni Google OAuth sono disponibili
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('Google OAuth non configurato. La funzionalità di login con Google sarà disabilitata.');
    } else {
        // Configura l'autenticazione Google solo se le configurazioni sono disponibili
        googleAuthService.initialize();
    }
    
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