// backend/src/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');

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
router.get('/', authenticateUser, async (req, res) => {
    try {
        const bookings = await bookingService.getUserBookings(req.userId);
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Ottieni una prenotazione specifica dell'utente corrente
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id, req.userId);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json({ booking });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// Aggiorna lo stato di una prenotazione
router.patch('/:id/status', authenticateUser, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const booking = await bookingService.updateBookingStatus(req.params.id, req.userId, status);
        res.json({ booking });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: error.message || 'Failed to update booking status' });
    }
});

// Aggiorna le richieste speciali di una prenotazione
router.patch('/:id/special-requests', authenticateUser, async (req, res) => {
    try {
        const { specialRequests } = req.body;
        
        if (specialRequests === undefined) {
            return res.status(400).json({ error: 'Special requests must be provided' });
        }
        
        const booking = await bookingService.updateSpecialRequests(req.params.id, req.userId, specialRequests);
        res.json({ booking });
    } catch (error) {
        console.error('Error updating special requests:', error);
        res.status(500).json({ error: error.message || 'Failed to update special requests' });
    }
});

module.exports = router;