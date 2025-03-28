// backend/src/controllers/authController.js
const authService = require('../services/auth/authService');
const { v4: uuidv4 } = require('uuid');

class AuthController {
    // Gestisce la registrazione di un nuovo utente
    async register(req, res) {
        try {
            const { email, password, name } = req.body;
            
            // Validazione base
            if (!email || !password || !name) {
                return res.status(400).json({ 
                    error: 'Dati mancanti',
                    message: 'Email, password e nome sono obbligatori'
                });
            }
            
            // Validazione email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Email non valida',
                    message: 'Formato email non valido'
                });
            }
            
            // Validazione password
            if (password.length < 8) {
                return res.status(400).json({
                    error: 'Password non valida',
                    message: 'La password deve essere di almeno 8 caratteri'
                });
            }
            
            // Registra l'utente
            const user = await authService.registerUser({
                email,
                password,
                name
            });
            
            // Genera i token
            const tokens = await authService.generateTokens(user);
            
            // Imposta i cookie
            const cookieOptions = require('../config/authConfig').cookieSettings;
            res.cookie('refreshToken', tokens.tokenId, cookieOptions);
            
            // Restituisci risposta
            res.status(201).json({
                message: 'Registrazione completata con successo',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                accessToken: tokens.accessToken
            });
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            
            // Gestisci l'errore di email già esistente
            if (error.message === 'Email already in use') {
                return res.status(409).json({
                    error: 'Email già in uso',
                    message: 'Questa email è già registrata'
                });
            }
            
            // Errore generico
            res.status(500).json({
                error: 'Errore di registrazione',
                message: 'Si è verificato un errore durante la registrazione'
            });
        }
    }

    // Gestisce il login di un utente
    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Validazione base
            if (!email || !password) {
                return res.status(400).json({ 
                    error: 'Dati mancanti',
                    message: 'Email e password sono obbligatori'
                });
            }
            
            // Effettua il login
            const user = await authService.loginUser(email, password);
            
            // Genera i token
            const tokens = await authService.generateTokens(user);
            
            // Imposta i cookie
            const cookieOptions = require('../config/authConfig').cookieSettings;
            res.cookie('refreshToken', tokens.tokenId, cookieOptions);
            
            // Restituisci risposta
            res.json({
                message: 'Login effettuato con successo',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                accessToken: tokens.accessToken
            });
        } catch (error) {
            console.error('Errore durante il login:', error);
            
            // Gestisci errori specifici
            if (error.message === 'User not found' || error.message === 'Invalid password') {
                return res.status(401).json({
                    error: 'Credenziali non valide',
                    message: 'Email o password non validi'
                });
            }
            
            if (error.message.includes('authentication')) {
                return res.status(400).json({
                    error: 'Metodo di autenticazione errato',
                    message: error.message
                });
            }
            
            // Errore generico
            res.status(500).json({
                error: 'Errore di login',
                message: 'Si è verificato un errore durante il login'
            });
        }
    }

    // Gestisce il logout di un utente
    async logout(req, res) {
        try {
            const tokenId = req.cookies.refreshToken;
            
            if (tokenId) {
                // Revoca il token
                await authService.revokeToken(tokenId);
                
                // Cancella il cookie
                res.clearCookie('refreshToken');
            }
            
            res.json({
                message: 'Logout effettuato con successo'
            });
        } catch (error) {
            console.error('Errore durante il logout:', error);
            res.status(500).json({
                error: 'Errore di logout',
                message: 'Si è verificato un errore durante il logout'
            });
        }
    }

    // Refresha il token di accesso
    async refreshToken(req, res) {
        try {
            const tokenId = req.cookies.refreshToken;
            const { refreshToken } = req.body;
            
            if (!tokenId || !refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token mancante',
                    message: 'Effettua nuovamente il login'
                });
            }
            
            // Genera un nuovo access token
            const newAccessToken = await authService.refreshAccessToken(tokenId, refreshToken);
            
            res.json({
                message: 'Token aggiornato con successo',
                accessToken: newAccessToken
            });
        } catch (error) {
            console.error('Errore durante il refresh del token:', error);
            
            // Cancella il cookie in caso di errore
            res.clearCookie('refreshToken');
            
            res.status(401).json({
                error: 'Token non valido',
                message: 'Effettua nuovamente il login'
            });
        }
    }

    // Ottiene il profilo dell'utente
    async getProfile(req, res) {
        try {
            const userId = req.userId;
            
            if (!userId) {
                return res.status(401).json({
                    error: 'Non autenticato',
                    message: 'Effettua il login per visualizzare il profilo'
                });
            }
            
            const user = await authService.getUserProfile(userId);
            
            res.json({
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    lastLogin: user.lastLogin
                }
            });
        } catch (error) {
            console.error('Errore durante il recupero del profilo:', error);
            res.status(500).json({
                error: 'Errore di profilo',
                message: 'Si è verificato un errore durante il recupero del profilo'
            });
        }
    }

    // Gestisce il login tramite Google
    async googleCallback(req, res) {
        try {
            // req.user è impostato da passport dopo l'autenticazione Google
            const user = req.user;
            
            if (!user) {
                return res.redirect('/auth/login?error=google-auth-failed');
            }
            
            // Genera i token
            const tokens = await authService.generateTokens(user);
            
            // Imposta i cookie
            const cookieOptions = require('../config/authConfig').cookieSettings;
            res.cookie('refreshToken', tokens.tokenId, cookieOptions);
            
            // Redirect alla pagina di successo con il token nell'URL (per applicazioni SPA)
            res.redirect(`/auth/success?token=${tokens.accessToken}`);
        } catch (error) {
            console.error('Errore durante il login Google:', error);
            res.redirect('/auth/login?error=google-auth-error');
        }
    }
}

module.exports = new AuthController();