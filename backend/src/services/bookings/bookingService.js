// backend/src/services/bookingService.js
const Booking = require('../models/Booking');
const { isMongoFallbackMode } = require('../config/database');

class BookingService {
    async getUserBookings(userId) {
        try {
            if (!userId) {
                throw new Error('UserId is required');
            }
            
            let bookings;
            if (isMongoFallbackMode) {
                // Se siamo in modalità fallback, usiamo una simulazione
                const { collections } = require('../utils/mongoFallback');
                bookings = (collections.booking || []).filter(booking => booking.userId === userId);
            } else {
                // Altrimenti, query standard MongoDB
                bookings = await Booking.find({ userId: userId }).sort({ checkIn: 1 });
            }
            
            return bookings;
        } catch (error) {
            console.error('Error fetching user bookings:', error);
            throw error;
        }
    }

    async getBookingById(bookingId, userId) {
        try {
            if (!bookingId) {
                throw new Error('Booking ID is required');
            }
            
            let booking;
            if (isMongoFallbackMode) {
                // Se siamo in modalità fallback, usiamo una simulazione
                const { collections } = require('../utils/mongoFallback');
                booking = (collections.booking || []).find(b => 
                    b._id.toString() === bookingId && 
                    (!userId || b.userId === userId));
            } else {
                // Se userId è fornito, verifica che la prenotazione appartenga all'utente
                const query = { _id: bookingId };
                if (userId) {
                    query.userId = userId;
                }
                booking = await Booking.findOne(query);
            }
            
            return booking;
        } catch (error) {
            console.error('Error fetching booking by ID:', error);
            throw error;
        }
    }

    async updateBookingStatus(bookingId, userId, newStatus) {
        try {
            // Verifica che lo stato sia valido
            const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
            }
            
            let booking;
            if (isMongoFallbackMode) {
                // Se siamo in modalità fallback, usiamo una simulazione
                const { collections } = require('../utils/mongoFallback');
                const bookingIndex = (collections.booking || []).findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                collections.booking[bookingIndex].status = newStatus;
                collections.booking[bookingIndex].updatedAt = new Date();
                booking = collections.booking[bookingIndex];
            } else {
                // Altrimenti, update standard MongoDB
                booking = await Booking.findOneAndUpdate(
                    { _id: bookingId, userId: userId },
                    { 
                        status: newStatus,
                        updatedAt: new Date()
                    },
                    { new: true } // Restituisce il documento aggiornato
                );
                
                if (!booking) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
            }
            
            return booking;
        } catch (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }
    }

    async updateSpecialRequests(bookingId, userId, specialRequests) {
        try {
            let booking;
            if (isMongoFallbackMode) {
                // Se siamo in modalità fallback, usiamo una simulazione
                const { collections } = require('../utils/mongoFallback');
                const bookingIndex = (collections.booking || []).findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                collections.booking[bookingIndex].specialRequests = specialRequests;
                collections.booking[bookingIndex].updatedAt = new Date();
                booking = collections.booking[bookingIndex];
            } else {
                // Altrimenti, update standard MongoDB
                booking = await Booking.findOneAndUpdate(
                    { _id: bookingId, userId: userId },
                    { 
                        specialRequests: specialRequests,
                        updatedAt: new Date()
                    },
                    { new: true }
                );
                
                if (!booking) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
            }
            
            return booking;
        } catch (error) {
            console.error('Error updating special requests:', error);
            throw error;
        }
    }

    // Formatta una prenotazione in un testo leggibile
    formatBooking(booking) {
        if (!booking) return 'Prenotazione non trovata';
        
        const checkIn = new Date(booking.checkIn).toLocaleDateString('it-IT');
        const checkOut = new Date(booking.checkOut).toLocaleDateString('it-IT');
        
        let statusItalian;
        switch (booking.status) {
            case 'Pending': statusItalian = 'In attesa'; break;
            case 'Confirmed': statusItalian = 'Confermata'; break;
            case 'Cancelled': statusItalian = 'Cancellata'; break;
            case 'Completed': statusItalian = 'Completata'; break;
            default: statusItalian = booking.status;
        }
        
        let paymentStatusItalian;
        switch (booking.paymentStatus) {
            case 'Pending': paymentStatusItalian = 'In attesa'; break;
            case 'Paid': paymentStatusItalian = 'Pagato'; break;
            case 'Refunded': paymentStatusItalian = 'Rimborsato'; break;
            default: paymentStatusItalian = booking.paymentStatus;
        }
        
        return `
ID Prenotazione: ${booking._id}
Ospite: ${booking.guestName}
Check-in: ${checkIn}
Check-out: ${checkOut}
Numero ospiti: ${booking.numberOfGuests}
Tipo camera: ${booking.roomType}
Stato: ${statusItalian}
Richieste speciali: ${booking.specialRequests || 'Nessuna'}
Prezzo totale: €${booking.totalPrice.toFixed(2)}
Stato pagamento: ${paymentStatusItalian}
        `.trim();
    }

    // Formatta un elenco di prenotazioni in un testo leggibile
    formatBookingsList(bookings) {
        if (!bookings || bookings.length === 0) {
            return 'Non hai prenotazioni attive.';
        }
        
        let result = `Hai ${bookings.length} prenotazioni:\n\n`;
        
        bookings.forEach((booking, index) => {
            const checkIn = new Date(booking.checkIn).toLocaleDateString('it-IT');
            const checkOut = new Date(booking.checkOut).toLocaleDateString('it-IT');
            
            let statusItalian;
            switch (booking.status) {
                case 'Pending': statusItalian = 'In attesa'; break;
                case 'Confirmed': statusItalian = 'Confermata'; break;
                case 'Cancelled': statusItalian = 'Cancellata'; break;
                case 'Completed': statusItalian = 'Completata'; break;
                default: statusItalian = booking.status;
            }
            
            result += `${index + 1}. ID: ${booking._id}\n`;
            result += `   ${booking.roomType} - ${checkIn} → ${checkOut}\n`;
            result += `   Stato: ${statusItalian}, €${booking.totalPrice.toFixed(2)}\n`;
            
            if (index < bookings.length - 1) {
                result += '\n';
            }
        });
        
        return result;
    }
}

module.exports = new BookingService();