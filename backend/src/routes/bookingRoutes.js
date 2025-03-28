// backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateJWT, optionalAuth } = require('../middleware/authMiddleware');

// Middleware per verificare che l'utente sia autenticato
// Sostituito con authenticateJWT

// Ottieni tutte le prenotazioni dell'utente corrente - richiede autenticazione
router.get('/', authenticateJWT, bookingController.getUserBookings);

// Ottieni una prenotazione specifica dell'utente corrente - richiede autenticazione
router.get('/:id', authenticateJWT, bookingController.getBookingById);

// Crea una nuova prenotazione - richiede autenticazione
router.post('/', authenticateJWT, bookingController.createBooking);

// Verifica disponibilità di una camera - autenticazione opzionale
router.post('/check-availability', optionalAuth, bookingController.checkAvailability);

// Aggiorna lo stato di una prenotazione - richiede autenticazione
router.patch('/:id/status', authenticateJWT, bookingController.updateBookingStatus);

// Aggiorna le richieste speciali di una prenotazione - richiede autenticazione
router.patch('/:id/special-requests', authenticateJWT, bookingController.updateSpecialRequests);

module.exports = router;