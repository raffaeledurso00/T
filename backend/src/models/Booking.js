const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    guestName: {
        type: String,
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    numberOfGuests: {
        type: Number,
        required: true
    },
    roomType: {
        type: String,
        required: true,
        enum: ['Standard', 'Deluxe', 'Suite', 'Villa']
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    specialRequests: {
        type: String
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Paid', 'Refunded'],
        default: 'Pending'
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

bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Booking', bookingSchema); 