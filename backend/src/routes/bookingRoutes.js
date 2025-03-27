// backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Middleware per verificare che l'utente sia autenticato
const authenticateUser = (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.body.userId;
    
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Normalmente qui verificheresti il token, ecc.
    // Per semplicità, assumiamo che l'invio di userId sia sufficiente
    req.userId = userId;
    next();
};

// Ottieni tutte le prenotazioni dell'utente corrente
router.get('/', authenticateUser, bookingController.getUserBookings);

// Ottieni una prenotazione specifica dell'utente corrente
router.get('/:id', authenticateUser, bookingController.getBookingById);

// Crea una nuova prenotazione
router.post('/', authenticateUser, bookingController.createBooking);

// Verifica disponibilità di una camera
router.post('/check-availability', bookingController.checkAvailability);

// Aggiorna lo stato di una prenotazione
router.patch('/:id/status', authenticateUser, bookingController.updateBookingStatus);

// Aggiorna le richieste speciali di una prenotazione
router.patch('/:id/special-requests', authenticateUser, bookingController.updateSpecialRequests);

module.exports = router;