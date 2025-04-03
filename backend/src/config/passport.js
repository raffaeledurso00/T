// src/config/passport.js
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const authConfig = require('./authConfig');
const authService = require('../services/auth/authService');

// JWT Strategy for token verification
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: authConfig.jwt.secret
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        const user = await User.findById(payload.id);
        
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));

// Google OAuth Strategy
if (authConfig.google.clientID && authConfig.google.clientSecret) {
    passport.use(new GoogleStrategy({
        clientID: authConfig.google.clientID,
        clientSecret: authConfig.google.clientSecret,
        callbackURL: authConfig.google.callbackURL,
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await authService.findOrCreateSocialUser(profile, 'google');
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));
}

// Serialization is not needed for JWT, but required for Passport to work properly
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;