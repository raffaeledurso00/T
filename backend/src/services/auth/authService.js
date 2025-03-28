// src/services/auth/authService.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const authConfig = require('../../config/authConfig');
const { redisClient, isRedisFallbackMode } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    constructor() {
        // Per memorizzare i token in memoria in caso di fallback
        this.inMemoryTokens = new Map();
    }

    async generateTokens(user) {
        try {
            // Payload del token
            const payload = {
                id: user._id,
                email: user.email,
                role: user.role
            };

            // Genera token di accesso
            const accessToken = jwt.sign(
                payload,
                authConfig.jwt.secret,
                { expiresIn: authConfig.jwt.expiresIn }
            );

            // Genera token di refresh
            const refreshToken = jwt.sign(
                { id: user._id },
                authConfig.jwt.secret,
                { expiresIn: authConfig.jwt.refreshExpiresIn }
            );

            // Memorizza refresh token
            const tokenId = uuidv4();
            
            if (isRedisFallbackMode) {
                // In memoria
                this.inMemoryTokens.set(tokenId, {
                    userId: user._id.toString(),
                    refreshToken,
                    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
                });
            } else {
                // In Redis
                await redisClient.set(
                    `refresh_token:${tokenId}`,
                    JSON.stringify({
                        userId: user._id.toString(),
                        refreshToken
                    }),
                    'EX',
                    30 * 24 * 60 * 60 // 30 giorni
                );
            }

            return {
                accessToken,
                refreshToken,
                tokenId
            };
        } catch (error) {
            console.error('Error generating tokens:', error);
            throw error;
        }
    }

    async refreshAccessToken(tokenId, refreshToken) {
        try {
            let storedToken;
            
            // Recupera token memorizzato
            if (isRedisFallbackMode) {
                storedToken = this.inMemoryTokens.get(tokenId);
            } else {
                const tokenData = await redisClient.get(`refresh_token:${tokenId}`);
                if (tokenData) {
                    storedToken = JSON.parse(tokenData);
                }
            }
            
            if (!storedToken || storedToken.refreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }
            
            // Verifica il refresh token
            const decoded = jwt.verify(refreshToken, authConfig.jwt.secret);
            
            // Ottieni l'utente
            const user = await User.findById(decoded.id);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Genera nuovo access token
            const payload = {
                id: user._id,
                email: user.email,
                role: user.role
            };
            
            const accessToken = jwt.sign(
                payload,
                authConfig.jwt.secret,
                { expiresIn: authConfig.jwt.expiresIn }
            );
            
            return accessToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    }

    async revokeToken(tokenId) {
        try {
            if (isRedisFallbackMode) {
                this.inMemoryTokens.delete(tokenId);
            } else {
                await redisClient.del(`refresh_token:${tokenId}`);
            }
            return true;
        } catch (error) {
            console.error('Error revoking token:', error);
            throw error;
        }
    }

    async registerUser(userData) {
        try {
            // Controlla se l'utente esiste già
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('Email already in use');
            }
            
            // Crea un nuovo utente
            const user = new User({
                email: userData.email,
                password: userData.password,
                name: userData.name,
                authProvider: 'local'
            });
            
            // Salva l'utente nel database
            await user.save();
            
            return user;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            // Trova l'utente per email
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }
            
            // Verifica se l'utente utilizza autenticazione locale
            if (user.authProvider !== 'local') {
                throw new Error(`This account uses ${user.authProvider} authentication`);
            }
            
            // Controlla la password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid password');
            }
            
            // Aggiorna l'ultimo accesso
            user.lastLogin = Date.now();
            await user.save();
            
            return user;
        } catch (error) {
            console.error('Error logging in user:', error);
            throw error;
        }
    }

    async findOrCreateSocialUser(profile, provider) {
        try {
            // Cerca l'utente per id del provider
            let user = await User.findOne({ 
                authProviderId: profile.id,
                authProvider: provider 
            });
            
            // Se non esiste, cerca per email
            if (!user && profile.emails && profile.emails.length > 0) {
                const email = profile.emails[0].value;
                user = await User.findOne({ email });
                
                // Se l'utente esiste ma usa un provider diverso
                if (user && user.authProvider !== provider) {
                    throw new Error(`This email is already registered with ${user.authProvider}`);
                }
            }
            
            // Se l'utente non esiste, creane uno nuovo
            if (!user) {
                user = new User({
                    email: profile.emails[0].value,
                    name: profile.displayName || `${profile.name.givenName} ${profile.name.familyName}`,
                    authProvider: provider,
                    authProviderId: profile.id,
                    profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
                });
                
                await user.save();
            }
            
            // Aggiorna l'ultimo accesso
            user.lastLogin = Date.now();
            await user.save();
            
            return user;
        } catch (error) {
            console.error('Error with social authentication:', error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            const user = await User.findById(userId, { password: 0 }); // Esclude la password
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();