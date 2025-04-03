// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            // Password è obbligatoria solo se non c'è un provider OAuth
            return !this.authProvider;
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook', null],
        default: 'local'
    },
    authProviderId: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);