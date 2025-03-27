// src/services/mistral/BookingIntegration.js
const bookingService = require('../bookingService');

class BookingIntegration {
    constructor() {
        this.dateRegex = /(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/g;
        this.roomTypes = ['Standard', 'Deluxe', 'Suite', 'Villa'];
    }

    // Determina se il messaggio è relativo alle prenotazioni
    isBookingRelatedQuery(message) {
        const bookingKeywords = [
            'prenotazion', 'booking', 'prenota', 'camera', 'stanza', 'soggiorno',
            'check-in', 'check in', 'checkout', 'check out', 'check-out',
            'cancella', 'modifica', 'cambia', 'aggiorna', 'richiesta speciale',
            'disponibilità', 'disponibile', 'prezzo camera', 'costo', 'notte',
            'periodo', 'data', 'giorno'
        ];
        
        const lowerMsg = message.toLowerCase();
        return bookingKeywords.some(keyword => lowerMsg.includes(keyword));
    }

    // Estrae l'ID di una prenotazione dal messaggio dell'utente
    extractBookingId(message) {
        // Pattern per ID MongoDB (24 caratteri esadecimali)
        const idPattern = /\b([0-9a-f]{24})\b/i;
        const match = message.match(idPattern);
        return match ? match[1] : null;
    }

    // Rileva l'intento dell'utente relativo alle prenotazioni
    detectBookingIntent(message) {
        const lowerMsg = message.toLowerCase();
        
        // Intento di visualizzazione prenotazioni
        if (/(mostr|vedi|visualizza|list|elenco).*prenotazion/i.test(lowerMsg) ||
            /le mie prenotazion/i.test(lowerMsg)) {
            return 'list';
        }
        
        // Intento di dettaglio prenotazione
        if (/(dettagli|informazioni|info).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'details';
        }
        
        // Intento di cancellazione prenotazione
        if (/(cancell|annull).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'cancel';
        }
        
        // Intento di modifica prenotazione
        if (/(modific|aggior|cambia).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'update';
        }
        
        // Intento di aggiunta richiesta speciale
        if (/(aggiung|inserir).*richiest/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'specialRequest';
        }
        
        // Intento di verifica disponibilità
        if (/(disponibilit|disponibile|libero|liber[ae]|prenot).*camera/i.test(lowerMsg) || 
            /(disponibilit|disponibile|libero|liber[ae]|prenot).*stanz[ae]/i.test(lowerMsg) ||
            /(camera|stanz[ae]).*disponibil/i.test(lowerMsg)) {
            return 'checkAvailability';
        }
        
        // Intento di nuova prenotazione
        if (/(vorrei|desidero|posso|potrei|voglio) (prenotare|riservare|fare una prenotazione)/i.test(lowerMsg)) {
            return 'createBooking';
        }
        
        // Se è una query generica sulle prenotazioni
        if (this.isBookingRelatedQuery(message)) {
            return 'general';
        }
        
        return null;
    }

    // Estrae le date dal messaggio
    extractDates(message) {
        const dates = [];
        let match;
        
        // Reset regex state
        this.dateRegex.lastIndex = 0;
        
        while ((match = this.dateRegex.exec(message)) !== null) {
            // Formato europeo: giorno/mese/anno
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-based
            const year = parseInt(match[3], 10);
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                dates.push(date);
            }
        }
        
        return dates;
    }

    // Estrae il tipo di camera dal messaggio
    extractRoomType(message) {
        const lowerMsg = message.toLowerCase();
        
        for (const roomType of this.roomTypes) {
            if (lowerMsg.includes(roomType.toLowerCase())) {
                return roomType;
            }
        }
        
        // Verifica per tipi di camera in italiano
        if (lowerMsg.includes('standard')) return 'Standard';
        if (lowerMsg.includes('deluxe')) return 'Deluxe';
        if (lowerMsg.includes('suite')) return 'Suite';
        if (lowerMsg.includes('villa')) return 'Villa';
        
        return null;
    }

    // Estrae il numero di ospiti dal messaggio
    extractGuestCount(message) {
        const matches = message.match(/(\d+)\s*(ospit[ie]|person[ae])/i);
        if (matches && matches[1]) {
            return parseInt(matches[1], 10);
        }
        return null;
    }

    // Estrae la richiesta speciale dal messaggio
    extractSpecialRequest(message) {
        // Se il messaggio contiene "richiesta speciale" o simili, estrai il testo dopo
        const match = message.match(/(special[ei]|particolare|aggiuntiva|specific[ao]).*?[:;](.+)/i);
        if (match && match[2]) {
            return match[2].trim();
        }
        
        // Altrimenti, prova a trovare il testo che segue la frase "aggiungi richiesta" o simili
        const addMatch = message.match(/(aggiung[io]|inseris[ci][io]|mett[io]).*?(richiest[ae]|not[ae]).*?[:;](.+)/i);
        if (addMatch && addMatch[3]) {
            return addMatch[3].trim();
        }
        
        // Ultima possibilità: estrai eventuali frasi tra virgolette
        const quoteMatch = message.match(/"([^"]+)"/);
        if (quoteMatch && quoteMatch[1]) {
            return quoteMatch[1].trim();
        }
        
        return null;
    }

    // Gestisce una query relativa alle prenotazioni
    async handleBookingQuery(message, userId) {
        if (!userId) {
            return "Per gestire le prenotazioni, è necessario effettuare l'accesso con il proprio account.";
        }
        
        const intent = this.detectBookingIntent(message);
        const bookingId = this.extractBookingId(message);
        
        // Gestisci diverse intenzioni
        switch (intent) {
            case 'list':
                try {
                    const bookings = await bookingService.getUserBookings(userId);
                    return bookingService.formatBookingsList(bookings);
                } catch (error) {
                    console.error('Error fetching bookings list:', error);
                    return "Mi dispiace, si è verificato un errore nel recupero delle tue prenotazioni. Riprova più tardi.";
                }
            
            case 'details':
                try {
                    const booking = await bookingService.getBookingById(bookingId, userId);
                    if (!booking) {
                        return `Non ho trovato una prenotazione con ID ${bookingId} associata al tuo account.`;
                    }
                    return bookingService.formatBooking(booking);
                } catch (error) {
                    console.error('Error fetching booking details:', error);
                    return "Mi dispiace, si è verificato un errore nel recupero dei dettagli della prenotazione. Riprova più tardi.";
                }
            
            case 'cancel':
                try {
                    const booking = await bookingService.updateBookingStatus(bookingId, userId, 'Cancelled');
                    return `La prenotazione con ID ${bookingId} è stata cancellata con successo. Se avevi già effettuato un pagamento, riceverai un rimborso secondo i termini previsti.`;
                } catch (error) {
                    console.error('Error cancelling booking:', error);
                    return `Non è stato possibile cancellare la prenotazione: ${error.message}`;
                }
            
            case 'update':
                // Per ora gestiamo solo aggiornamenti specifici
                return "Per modificare la tua prenotazione, specifica quale aspetto vuoi cambiare (ad esempio 'aggiungi richiesta speciale')";
            
            case 'specialRequest':
                try {
                    const specialRequest = this.extractSpecialRequest(message);
                    if (!specialRequest) {
                        return "Per favore, specifica la richiesta speciale che desideri aggiungere.";
                    }
                    
                    await bookingService.updateSpecialRequests(bookingId, userId, specialRequest);
                    return `La richiesta speciale è stata aggiunta alla prenotazione ${bookingId}.`;
                } catch (error) {
                    console.error('Error updating special request:', error);
                    return `Non è stato possibile aggiornare la richiesta speciale: ${error.message}`;
                }
            
            case 'checkAvailability':
                try {
                    const dates = this.extractDates(message);
                    const roomType = this.extractRoomType(message);
                    
                    if (dates.length < 2) {
                        return "Per verificare la disponibilità, ho bisogno di conoscere la data di check-in e check-out. Puoi indicarle nel formato GG/MM/AAAA?";
                    }
                    
                    if (!roomType) {
                        return "Per quale tipo di camera desideri verificare la disponibilità? Abbiamo: Standard, Deluxe, Suite e Villa.";
                    }
                    
                    // Ordina le date
                    dates.sort((a, b) => a - b);
                    const checkIn = dates[0];
                    const checkOut = dates[1];
                    
                    const availability = await bookingService.checkAvailability(
                        checkIn,
                        checkOut,
                        roomType
                    );
                    
                    if (availability.available) {
                        return `Ottima notizia! La camera ${roomType} è disponibile dal ${checkIn.toLocaleDateString('it-IT')} al ${checkOut.toLocaleDateString('it-IT')}. Desideri procedere con la prenotazione?`;
                    } else {
                        return `Mi dispiace, la camera ${roomType} non è disponibile per il periodo richiesto. Vuoi provare con date diverse o un altro tipo di camera?`;
                    }
                } catch (error) {
                    console.error('Error checking availability:', error);
                    return "Mi dispiace, si è verificato un errore nel verificare la disponibilità. Riprova più tardi.";
                }
            
            case 'createBooking':
                const dates = this.extractDates(message);
                const roomType = this.extractRoomType(message);
                const guestCount = this.extractGuestCount(message);
                
                if (dates.length < 2 || !roomType || !guestCount) {
                    let response = "Per procedere con la prenotazione, ho bisogno di alcune informazioni:\n\n";
                    
                    if (dates.length < 2) {
                        response += "- Data di check-in e check-out (formato GG/MM/AAAA)\n";
                    }
                    
                    if (!roomType) {
                        response += "- Tipo di camera (Standard, Deluxe, Suite o Villa)\n";
                    }
                    
                    if (!guestCount) {
                        response += "- Numero di ospiti\n";
                    }
                    
                    response += "\nPuoi fornirmi queste informazioni?";
                    return response;
                }
                
                // Potremmo procedere con la creazione, ma per sicurezza confermiamo prima
                dates.sort((a, b) => a - b);
                const checkInDate = dates[0].toLocaleDateString('it-IT');
                const checkOutDate = dates[1].toLocaleDateString('it-IT');
                
                return `Perfetto! Posso procedere con la prenotazione di una camera ${roomType} per ${guestCount} ospiti, dal ${checkInDate} al ${checkOutDate}.\n\n` +
                       `Per completare la prenotazione, ti consiglio di visitare la sezione "Prenotazioni" del nostro sito web o contattare la reception al numero +39 055 1234567.\n\n` +
                       `Posso aiutarti con qualcos'altro?`;
            
            case 'general':
                // Risposta generica per query sulle prenotazioni
                return "Posso aiutarti con le tue prenotazioni. Puoi chiedermi di:\n\n" +
                       "- Mostrare le tue prenotazioni esistenti\n" +
                       "- Verificare la disponibilità di una camera\n" +
                       "- Verificare i dettagli di una prenotazione specifica\n" +
                       "- Cancellare una prenotazione\n" +
                       "- Aggiungere richieste speciali\n\n" +
                       "Cosa desideri fare?";
            
            default:
                return null; // Questo messaggio non è relativo alle prenotazioni
        }
    }
}

module.exports = new BookingIntegration();