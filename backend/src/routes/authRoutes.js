// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// Registrazione di un nuovo utente
router.post('/register', authController.register);

// Login con credenziali locali
router.post('/login', authController.login);

// Logout
router.post('/logout', authController.logout);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Ottieni profilo utente (richiede autenticazione)
router.get('/profile', authenticateJWT, authController.getProfile);

// Autenticazione con Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback dopo autenticazione Google
router.get('/google/callback',
    passport.authenticate('google', { 
        session: false,
        failureRedirect: '/auth/login?error=google-auth-failed'
    }),
    authController.googleCallback
);

// Endpoint di successo per SPA
router.get('/success', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Autenticazione Completata</title>
                <script>
                    // Estrai il token dall'URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const token = urlParams.get('token');
                    
                    // Memorizza il token e reindirizza alla home
                    if (token) {
                        localStorage.setItem('accessToken', token);
                        window.location.href = '/';
                    }
                </script>
            </head>
            <body>
                <h1>Autenticazione completata con successo</h1>
                <p>Stai per essere reindirizzato...</p>
            </body>
        </html>
    `);
});

// Verifica validità token
router.post('/verify-token', authenticateJWT, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.userId,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;