// backend/src/services/bookings/bookingService.js
const Booking = require('../../models/Booking');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Determine if we're in fallback mode based on MongoDB connection state
const isMongoFallbackMode = () => {
    return mongoose.connection.readyState !== 1; // 1 = connected
};

class BookingService {
    constructor() {
        // Initialize memory for fallback if MongoDB isn't available
        this.inMemoryBookings = [];
    }

    async getUserBookings(userId) {
        try {
            if (!userId) {
                throw new Error('UserId is required');
            }
            
            let bookings;
            if (isMongoFallbackMode()) {
                // If we're in fallback mode, use local memory
                bookings = this.inMemoryBookings.filter(booking => booking.userId === userId);
            } else {
                // Otherwise, standard MongoDB query
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
            if (isMongoFallbackMode()) {
                // If we're in fallback mode, search in memory
                booking = this.inMemoryBookings.find(b => 
                    b._id.toString() === bookingId && 
                    (!userId || b.userId === userId));
            } else {
                // If userId is provided, verify the booking belongs to the user
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

            // Generate an ID if not provided
            if (!bookingData._id) {
                bookingData._id = uuidv4();
            }

            // Set status and timestamp
            bookingData.status = bookingData.status || 'Pending';
            bookingData.paymentStatus = bookingData.paymentStatus || 'Pending';
            bookingData.createdAt = new Date();
            bookingData.updatedAt = new Date();

            let newBooking;
            if (isMongoFallbackMode()) {
                // Save to memory
                this.inMemoryBookings.push(bookingData);
                newBooking = bookingData;
            } else {
                // Save to database
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
            // Verify status is valid
            const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
            if (!validStatuses.includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
            }
            
            let booking;
            if (isMongoFallbackMode()) {
                // Update in memory
                const bookingIndex = this.inMemoryBookings.findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                this.inMemoryBookings[bookingIndex].status = newStatus;
                this.inMemoryBookings[bookingIndex].updatedAt = new Date();
                booking = this.inMemoryBookings[bookingIndex];
            } else {
                // Update in database
                booking = await Booking.findOneAndUpdate(
                    { _id: bookingId, userId: userId },
                    { 
                        status: newStatus,
                        updatedAt: new Date()
                    },
                    { new: true } // Return updated document
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
            if (isMongoFallbackMode()) {
                // Update in memory
                const bookingIndex = this.inMemoryBookings.findIndex(b => 
                    b._id.toString() === bookingId && b.userId === userId);
                
                if (bookingIndex === -1) {
                    throw new Error('Booking not found or you do not have permission to update it');
                }
                
                this.inMemoryBookings[bookingIndex].specialRequests = specialRequests;
                this.inMemoryBookings[bookingIndex].updatedAt = new Date();
                booking = this.inMemoryBookings[bookingIndex];
            } else {
                // Update in database
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

    // Check availability for a period
    async checkAvailability(checkIn, checkOut, roomType) {
        try {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);

            // Verify dates are valid
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                throw new Error('Invalid date format');
            }

            // Verify check-out is after check-in
            if (checkOutDate <= checkInDate) {
                throw new Error('Check-out date must be after check-in date');
            }

            let bookings;
            if (isMongoFallbackMode()) {
                // Search for bookings in memory that overlap with the period
                bookings = this.inMemoryBookings.filter(b => 
                    b.roomType === roomType &&
                    b.status !== 'Cancelled' &&
                    new Date(b.checkIn) < checkOutDate &&
                    new Date(b.checkOut) > checkInDate
                );
            } else {
                // Search in database
                bookings = await Booking.find({
                    roomType: roomType,
                    status: { $ne: 'Cancelled' },
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate }
                });
            }

            // If there are no overlapping bookings, the room is available
            return {
                available: bookings.length === 0,
                conflictingBookings: bookings
            };
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    // Format a booking into readable text
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

    // Format a list of bookings into readable text
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