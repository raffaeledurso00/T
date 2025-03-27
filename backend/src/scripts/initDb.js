// src/scripts/initDb.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('dotenv').config();

// Import data
const initialVillaInfo = require('../data/villaInfo');
const initialServices = require('../data/services');
const initialRestaurant = require('../data/restaurant');
const initialEvents = require('../data/events');

// Define missing models if they don't exist
const villaInfoSchema = new mongoose.Schema({
    name: String,
    description: String,
    address: String,
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
    rooms: [{
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
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const serviceSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    price: Number,
    available: Boolean,
    schedule: {
        startTime: String,
        endTime: String,
        days: [String]
    }
});

const bookingSchema = new mongoose.Schema({
    guestName: String,
    checkIn: Date,
    checkOut: Date,
    numberOfGuests: Number,
    roomType: String,
    status: String,
    specialRequests: String,
    totalPrice: Number,
    paymentStatus: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Definisci lo schema per il ristorante
const restaurantSchema = new mongoose.Schema({
    name: String,
    description: String,
    openingHours: {
        lunch: {
            start: String,
            end: String,
            days: [String]
        },
        dinner: {
            start: String,
            end: String,
            days: [String]
        }
    },
    menu: {
        antipasti: [{
            name: String,
            description: String,
            price: Number,
            available: Boolean
        }],
        primi: [{
            name: String,
            description: String,
            price: Number,
            available: Boolean
        }],
        secondi: [{
            name: String,
            description: String,
            price: Number,
            available: Boolean
        }],
        dolci: [{
            name: String,
            description: String,
            price: Number,
            available: Boolean
        }]
    },
    wineList: [{
        name: String,
        producer: String,
        year: Number,
        price: Number,
        available: Boolean
    }],
    specialEvents: [{
        name: String,
        description: String,
        price: Number,
        available: Boolean,
        schedule: {
            days: [String],
            time: String
        }
    }]
});

// Definisci lo schema per gli eventi
const eventSchema = new mongoose.Schema({
    name: String,
    description: String,
    date: String,
    time: String,
    duration: String,
    price: Number,
    maxParticipants: Number,
    available: Boolean,
    location: String,
    includes: [String]
});

// Registra i modelli se non esistono già
let VillaInfo, Service, Booking, Restaurant, Event;

try {
    VillaInfo = mongoose.model('VillaInfo');
} catch (error) {
    VillaInfo = mongoose.model('VillaInfo', villaInfoSchema);
}

try {
    Service = mongoose.model('Service');
} catch (error) {
    Service = mongoose.model('Service', serviceSchema);
}

try {
    Booking = mongoose.model('Booking');
} catch (error) {
    Booking = mongoose.model('Booking', bookingSchema);
}

try {
    Restaurant = mongoose.model('Restaurant');
} catch (error) {
    Restaurant = mongoose.model('Restaurant', restaurantSchema);
}

try {
    Event = mongoose.model('Event');
} catch (error) {
    Event = mongoose.model('Event', eventSchema);
}

async function initializeDatabase() {
    try {
        // Connessione a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa-petriolo');
        console.log('Connected to MongoDB');

        // Inizializza VillaInfo
        await VillaInfo.deleteMany({});
        await VillaInfo.create(initialVillaInfo);
        console.log('VillaInfo initialized');

        // Inizializza Services
        await Service.deleteMany({});
        await Service.insertMany(initialServices);
        console.log('Services initialized');

        // Inizializza Restaurant
        await Restaurant.deleteMany({});
        await Restaurant.create(initialRestaurant);
        console.log('Restaurant initialized');

        // Inizializza Events
        await Event.deleteMany({});
        await Event.insertMany(initialEvents);
        console.log('Events initialized');

        // Pulisci le prenotazioni esistenti
        await Booking.deleteMany({});
        console.log('Existing bookings cleared');

        console.log('Database initialization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();