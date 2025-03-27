// backend/src/scripts/populateBookings.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('dotenv').config();

// Importa il modello Booking
const Booking = require('../models/Booking');

// Funzione per generare date casuali in un intervallo
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Funzione per generare un numero casuale in un intervallo
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Array di nomi casuali per i clienti
const guestNames = [
    "Mario Rossi", "Luigi Bianchi", "Anna Verdi", "Sofia Neri", "Marco Russo",
    "Giulia Ferrari", "Andrea Esposito", "Laura Romano", "Paolo Ricci", "Francesca Marino",
    "Giovanni Greco", "Alessia Bruno", "Roberto Gallo", "Chiara Conti", "Davide Mancini",
    "Elena Costa", "Luca Giordano", "Martina Lombardi", "Stefano Moretti", "Simona Barbieri"
];

// Array di tipi di camere disponibili
const roomTypes = ["Standard", "Deluxe", "Suite", "Villa"];

// Array di stati possibili per le prenotazioni
const bookingStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"];

// Array di stati possibili per i pagamenti
const paymentStatuses = ["Pending", "Paid", "Refunded"];

// Array di richieste speciali possibili
const specialRequests = [
    "Vista sul giardino",
    "Camera al piano alto",
    "Camera tranquilla",
    "Servizio in camera anticipato",
    "Culla per bambino",
    "Trattamento VIP",
    "Bottiglia di spumante in camera all'arrivo",
    "Intolleranza al glutine",
    "Intolleranza al lattosio",
    "Menu vegano",
    "Allergia ai frutti di mare",
    "Transfer dall'aeroporto",
    "Late check-out",
    "Early check-in",
    "Prenotazione ristorante per la prima sera",
    "",
    "",
    ""
];

// Funzione per generare una prenotazione casuale
function generateRandomBooking(userId = null) {
    // Se non viene fornito un userId, usa il nome come userId
    const guestName = guestNames[randomInt(0, guestNames.length - 1)];
    const userIdentifier = userId || guestName.toLowerCase().replace(/\s+/g, '.') + '@example.com';
    
    // Generate check-in date (between today and next 6 months)
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);
    
    const checkIn = randomDate(today, sixMonthsLater);
    
    // Generate check-out date (between 1 and 14 days after check-in)
    const minCheckOut = new Date(checkIn);
    minCheckOut.setDate(checkIn.getDate() + 1);
    
    const maxCheckOut = new Date(checkIn);
    maxCheckOut.setDate(checkIn.getDate() + 14);
    
    const checkOut = randomDate(minCheckOut, maxCheckOut);
    
    // Calculate length of stay in days
    const stayLength = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    // Select random room type
    const roomType = roomTypes[randomInt(0, roomTypes.length - 1)];
    
    // Determine base price based on room type
    let basePrice;
    switch (roomType) {
        case "Standard":
            basePrice = 150;
            break;
        case "Deluxe":
            basePrice = 250;
            break;
        case "Suite":
            basePrice = 400;
            break;
        case "Villa":
            basePrice = 800;
            break;
        default:
            basePrice = 200;
    }
    
    // Generate number of guests
    const numberOfGuests = randomInt(1, roomType === "Villa" ? 8 : (roomType === "Suite" ? 4 : 2));
    
    // Calculate total price
    const totalPrice = basePrice * stayLength * (1 + (numberOfGuests > 2 ? 0.2 : 0));
    
    // Select status (weight more towards Confirmed for realistic data)
    let status;
    const statusRandom = Math.random();
    if (statusRandom < 0.6) {
        status = "Confirmed";
    } else if (statusRandom < 0.8) {
        status = "Pending";
    } else if (statusRandom < 0.9) {
        status = "Completed";
    } else {
        status = "Cancelled";
    }
    
    // Select payment status based on booking status
    let paymentStatus;
    if (status === "Confirmed" || status === "Completed") {
        paymentStatus = Math.random() < 0.8 ? "Paid" : "Pending";
    } else if (status === "Cancelled") {
        paymentStatus = Math.random() < 0.3 ? "Refunded" : "Paid";
    } else {
        paymentStatus = "Pending";
    }
    
    // Select a special request (or none)
    const specialRequest = Math.random() < 0.6 ? specialRequests[randomInt(0, specialRequests.length - 1)] : "";
    
    // Create the booking object
    return {
        guestName,
        userId: userIdentifier,
        checkIn,
        checkOut,
        numberOfGuests,
        roomType,
        status,
        specialRequests: specialRequest,
        totalPrice,
        paymentStatus,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// Funzione principale per popolare il database
async function populateBookings() {
    try {
        // Connessione a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/villa-petriolo');
        console.log('Connected to MongoDB');

        // Elimina le prenotazioni esistenti
        await Booking.deleteMany({});
        console.log('Existing bookings cleared');

        // Crea 50 prenotazioni casuali
        const bookings = [];
        for (let i = 0; i < 50; i++) {
            bookings.push(generateRandomBooking());
        }

        // Aggiungi alcune prenotazioni specifiche per utenti test
        // Queste saranno utili per testare la funzionalità di gestione prenotazioni
        const testUsers = [
            "mario.rossi@example.com",
            "anna.verdi@example.com",
            "guest@villapetriolo.com"
        ];

        for (const user of testUsers) {
            // Aggiungi 3 prenotazioni per ogni utente test
            for (let i = 0; i < 3; i++) {
                bookings.push(generateRandomBooking(user));
            }
        }

        // Salva tutte le prenotazioni nel database
        await Booking.insertMany(bookings);
        console.log(`${bookings.length} bookings have been created`);

        console.log('Database population completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error populating database:', error);
        process.exit(1);
    }
}

// Esegui la funzione principale
populateBookings();