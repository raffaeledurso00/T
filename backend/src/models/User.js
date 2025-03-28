// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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

// Pre-save hook per hash della password
userSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Hash della password solo se è stata modificata o è nuova
    if (this.password && (this.isModified('password') || this.isNew)) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Metodo per confrontare password
userSchema.methods.comparePassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);