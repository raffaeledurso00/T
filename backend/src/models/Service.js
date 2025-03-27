const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Transportation', 'Housekeeping', 'Concierge', 'Activities', 'Dining', 'Wellness', 'Other']
    },
    price: {
        type: Number,
        required: true
    },
    available: {
        type: Boolean,
        default: true
    },
    schedule: {
        startTime: String,
        endTime: String,
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }]
    },
    capacity: {
        type: Number
    },
    requirements: [{
        type: String
    }],
    notes: {
        type: String
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

serviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Service', serviceSchema); 