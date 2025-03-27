// backend/src/services/mistral/BookingHandler.js
const bookingService = require('../bookingService');

class BookingHandler {
    // Controlla se il messaggio è relativo alle prenotazioni
    isBookingRelatedQuery(message) {
        const bookingKeywords = [
            'prenotazion', 'booking', 'prenota', 'camera', 'stanza', 'soggiorno',
            'check-in', 'check in', 'checkout', 'check-out', 'check out', 
            'cancella', 'modifica', 'cambia', 'aggiorna'
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

    // Determina l'intento dell'utente dal messaggio
    detectBookingIntent(message) {
        const lowerMsg = message.toLowerCase();
        
        if (/(mostra|vedi|visualizza|lista|elenco).*prenotazion/i.test(lowerMsg) ||
            /le mie prenotazion/i.test(lowerMsg)) {
            return 'list';
        }
        
        if (/(dettagli|informazioni|info).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'details';
        }
        
        if (/(cancella|annulla).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'cancel';
        }
        
        if (/(modifica|aggiorna|cambia).*prenotazion/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'update';
        }
        
        if (/(aggiungi|inserisci).*richiest/i.test(lowerMsg) && 
            this.extractBookingId(message)) {
            return 'specialRequest';
        }
        
        // Se è una query generica sulle prenotazioni
        if (this.isBookingRelatedQuery(message)) {
            return 'general';
        }
        
        return null;
    }

    // Estrae la richiesta speciale dal messaggio
    extractSpecialRequest(message) {
        // Se il messaggio contiene "richiesta speciale" o simili, estrai il testo dopo
        const match = message.match(/(special|particolare|aggiuntiva|specifico).*?:(.+)/i);
        if (match && match[2]) {
            return match[2].trim();
        }
        
        // Altrimenti, prova a trovare il testo che segue la frase "aggiungi richiesta" o simili
        const addMatch = message.match(/(aggiungi|inserisci|metti).*?(richiest[ae]|not[ae]).*?:(.+)/i);
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
            
            case 'general':
                // Risposta generica per query sulle prenotazioni
                return "Posso aiutarti con le tue prenotazioni. Puoi chiedermi di:\n" +
                       "- Mostrare tutte le tue prenotazioni\n" +
                       "- Visualizzare i dettagli di una prenotazione specifica\n" +
                       "- Cancellare una prenotazione\n" +
                       "- Aggiungere richieste speciali\n\n" +
                       "Per iniziare, vuoi vedere l'elenco delle tue prenotazioni?";
            
            default:
                return null; // Questo messaggio non è relativo alle prenotazioni
        }
    }
}

module.exports = new BookingHandler();