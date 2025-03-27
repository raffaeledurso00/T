// Fixed villaInfo.js data structure
module.exports = {
    name: 'Villa Petriolo',
    description: 'Un\'esclusiva villa di lusso nel cuore della Toscana, circondata da vigneti e uliveti secolari.',
    address: 'Via Petriolo, 123 - 50020 Greve in Chianti (FI)',
    contactInfo: {
        phone: '+39 055 1234567',
        email: 'info@villapetriolo.com',
        emergencyContact: '+39 055 9876543'
    },
    amenities: [
        {
            name: 'Piscina',
            description: 'Piscina all\'aperto con vista panoramica',
            available: true
        },
        {
            name: 'Spa',
            description: 'Spa con sauna e bagno turco',
            available: true
        },
        {
            name: 'Parcheggio',
            description: 'Parcheggio privato per gli ospiti',
            available: true
        }
    ],
    // Rooms formatted as an array of strings as expected by the schema
    rooms: ['Suite', 'Deluxe'],
    roomDetails: [
        {
            type: 'Suite',
            description: 'Suite di lusso con vista panoramica',
            capacity: 2,
            price: 500,
            available: true
        },
        {
            type: 'Deluxe',
            description: 'Camera deluxe con terrazza',
            capacity: 2,
            price: 350,
            available: true
        }
    ],
    services: [
        {
            name: 'Degustazione Vini',
            description: 'Degustazione guidata dei vini locali',
            price: 50,
            available: true
        },
        {
            name: 'Corso di Cucina',
            description: 'Corso di cucina toscana tradizionale',
            price: 100,
            available: true
        }
    ],
    policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: 'Gratuita fino a 48 ore prima del check-in',
        pets: 'Non ammessi',
        smoking: 'Non consentito'
    }
};