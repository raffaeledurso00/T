// src/services/auth/googleAuthService.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authConfig = require('../../config/authConfig');
const authService = require('./authService');

class GoogleAuthService {
    initialize() {
        passport.use(new GoogleStrategy({
            clientID: authConfig.google.clientID,
            clientSecret: authConfig.google.clientSecret,
            callbackURL: authConfig.google.callbackURL,
            passReqToCallback: true
        }, async (req, accessToken, refreshToken, profile, done) => {
            try {
                const user = await authService.findOrCreateSocialUser(profile, 'google');
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }));
    }
}

module.exports = new GoogleAuthService();