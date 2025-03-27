// Fixed VillaInfo.js model
const mongoose = require('mongoose');

const villaInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Villa Petriolo'
    },
    description: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    contactInfo: {
        phone: String,
        email: String,
        emergencyContact: String
    },
    amenities: [{
        name: String,
        description: String,
        available: Boolean
    }],
    // Changed to array of strings
    rooms: [String],
    // Added roomDetails array for the detailed information
    roomDetails: [{
        type: String,
        description: String,
        capacity: Number,
        price: Number,
        available: Boolean
    }],
    services: [{
        name: String,
        description: String,
        price: Number,
        available: Boolean
    }],
    policies: {
        checkIn: String,
        checkOut: String,
        cancellation: String,
        pets: String,
        smoking: String
    },
    images: [{
        url: String,
        description: String
    }],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

villaInfoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('VillaInfo', villaInfoSchema);