// backend/src/controllers/bookingController.js
const bookingService = require('../services/bookings/bookingService');
const { v4: uuidv4 } = require('uuid');

class BookingController {
    // Ottieni tutte le prenotazioni dell'utente corrente
    async getUserBookings(req, res) {
        try {
            const userId = req.headers['x-user-id'] || req.body.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const bookings = await bookingService.getUserBookings(userId);
            res.json({ bookings });
        } catch (error) {
            console.error('Error fetching user bookings:', error);
            res.status(500).json({ error: 'Failed to fetch bookings', message: error.message });
        }
    }

    // Ottieni una prenotazione specifica dell'utente corrente
    async getBookingById(req, res) {
        try {
            const userId = req.headers['x-user-id'] || req.body.userId;
            const bookingId = req.params.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const booking = await bookingService.getBookingById(bookingId, userId);
            
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            res.json({ booking });
        } catch (error) {
            console.error('Error fetching booking:', error);
            res.status(500).json({ error: 'Failed to fetch booking', message: error.message });
        }
    }

    // Crea una nuova prenotazione
    async createBooking(req, res) {
        try {
            const userId = req.headers['x-user-id'] || req.body.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const bookingData = {
                ...req.body,
                userId,
                _id: uuidv4()
            };
            
            // Verifica disponibilità prima di creare la prenotazione
            const availability = await bookingService.checkAvailability(
                bookingData.checkIn,
                bookingData.checkOut,
                bookingData.roomType
            );
            
            if (!availability.available) {
                return res.status(409).json({ 
                    error: 'Room not available for the selected dates',
                    conflictingDates: availability.conflictingBookings.map(b => ({
                        checkIn: b.checkIn,
                        checkOut: b.checkOut
                    }))
                });
            }
            
            const newBooking = await bookingService.createBooking(bookingData);
            res.status(201).json({ booking: newBooking });
        } catch (error) {
            console.error('Error creating booking:', error);
            res.status(500).json({ error: 'Failed to create booking', message: error.message });
        }
    }

    // Aggiorna lo stato di una prenotazione
    async updateBookingStatus(req, res) {
        try {
            const userId = req.headers['x-user-id'] || req.body.userId;
            const bookingId = req.params.id;
            const { status } = req.body;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }
            
            const booking = await bookingService.updateBookingStatus(bookingId, userId, status);
            res.json({ booking });
        } catch (error) {
            console.error('Error updating booking status:', error);
            res.status(500).json({ error: 'Failed to update booking status', message: error.message });
        }
    }

    // Aggiorna le richieste speciali di una prenotazione
    async updateSpecialRequests(req, res) {
        try {
            const userId = req.headers['x-user-id'] || req.body.userId;
            const bookingId = req.params.id;
            const { specialRequests } = req.body;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            if (specialRequests === undefined) {
                return res.status(400).json({ error: 'Special requests must be provided' });
            }
            
            const booking = await bookingService.updateSpecialRequests(bookingId, userId, specialRequests);
            res.json({ booking });
        } catch (error) {
            console.error('Error updating special requests:', error);
            res.status(500).json({ error: 'Failed to update special requests', message: error.message });
        }
    }

    // Verifica la disponibilità per un determinato periodo
    async checkAvailability(req, res) {
        try {
            const { checkIn, checkOut, roomType } = req.body;
            
            if (!checkIn || !checkOut || !roomType) {
                return res.status(400).json({ error: 'Check-in date, check-out date, and room type are required' });
            }
            
            const availability = await bookingService.checkAvailability(checkIn, checkOut, roomType);
            res.json(availability);
        } catch (error) {
            console.error('Error checking availability:', error);
            res.status(500).json({ error: 'Failed to check availability', message: error.message });
        }
    }
}

module.exports = new BookingController();