// backend/src/services/bookingService.js
const Booking = require('../models/Booking');
const { isMongoFallbackMode } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BookingService {
    constructor() {
        // Inizializza memoria per fallback se MongoDB non è disponibile
        this.inMemoryBookings = [];
    }

    async getUserBookings(userId) {
        try {
            if (!userId) {
                throw new Error('UserId is required');
            }
            
            let bookings;
            if (isMongoFallbackMode) {
                // Se siamo in modalità fallback, usiamo la memoria locale
                bookings = this.inMemoryBookings.filter(booking => booking.userId === userId);
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
                // Se siamo in modalità fallback, cerchiamo in memoria
                booking = this.inMemoryBookings.find(b => 
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

    async createBooking(bookingData) {
        try {
            if (!bookingData.userId) {
                throw new Error('User ID is required for booking');
            }

            if (!bookingData.checkIn || !bookingData.checkOut) {
                throw new Error('Check-in and check-out dates are required');
            }

            if (!bookingData.roomType) {
                throw new Error('Room type is required');
            }

            // Genera un ID se non fornito
            if (!bookingData._id) {
                bookingData._id = uuidv4();
            }

            // Imposta stato e timestamp
            bookingData.status = bookingData.status || 'Pending';
            bookingData.paymentStatus = bookingData.paymentStatus || 'Pending';
            bookingData.createdAt = new Date();
            bookingData.updatedAt = new Date();

            let newBooking;
            if (isMongoFallbackMode) {
                // Salva in memoria
                this.inMemoryBookings.push(bookingData);
                newBooking = bookingData;
            } else {
                // Salva nel database
                newBooking = await Booking.create(bookingData);
            }

            return newBooking;
        } catch (error) {
            console.error('Error creating booking:', error);
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
                // Aggiorna in memoria
                const bookingIndex = this.inMemoryBookings.findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                this.inMemoryBookings[bookingIndex].status = newStatus;
                this.inMemoryBookings[bookingIndex].updatedAt = new Date();
                booking = this.inMemoryBookings[bookingIndex];
            } else {
                // Aggiorna nel database
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
                // Aggiorna in memoria
                const bookingIndex = this.inMemoryBookings.findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                this.inMemoryBookings[bookingIndex].specialRequests = specialRequests;
                this.inMemoryBookings[bookingIndex].updatedAt = new Date();
                booking = this.inMemoryBookings[bookingIndex];
            } else {
                // Aggiorna nel database
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

    // Verifica disponibilità per un periodo
    async checkAvailability(checkIn, checkOut, roomType) {
        try {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            // Verifica che le date siano valide
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                throw new Error('Invalid date format');
            }

            // Verifica che check-out sia dopo check-in
            if (checkOutDate <= checkInDate) {
                throw new Error('Check-out date must be after check-in date');
            }

            let bookings;
            if (isMongoFallbackMode) {
                // Cerca prenotazioni in memoria che si sovrappongono al periodo
                bookings = this.inMemoryBookings.filter(b => 
                    b.roomType === roomType &&
                    b.status !== 'Cancelled' &&
                    new Date(b.checkIn) < checkOutDate &&
                    new Date(b.checkOut) > checkInDate
                );
            } else {
                // Cerca nel database
                bookings = await Booking.find({
                    roomType: roomType,
                    status: { $ne: 'Cancelled' },
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate }
                });
            }

            // Se non ci sono prenotazioni sovrapposte, la camera è disponibile
            return {
                available: bookings.length === 0,
                conflictingBookings: bookings
            };
        } catch (error) {
            console.error('Error checking availability:', error);
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