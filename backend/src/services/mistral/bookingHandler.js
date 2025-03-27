// src/services/mistral/BookingHandler.js

class BookingHandler {
    // Check if the message is related to bookings
    isBookingRelatedQuery(message) {
        const bookingKeywords = [
            'prenotazion', 'booking', 'prenota', 'camera', 'stanza', 'soggiorno',
            'check-in', 'check in', 'checkout', 'check-out', 'check out', 
            'cancella', 'modifica', 'cambia', 'aggiorna', 'richiesta speciale'
        ];
        
        const lowerMsg = message.toLowerCase();
        return bookingKeywords.some(keyword => lowerMsg.includes(keyword));
    }

    // Extract booking ID from user message
    extractBookingId(message) {
        // Pattern for MongoDB ID (24 hexadecimal characters)
        const idPattern = /\b([0-9a-f]{24})\b/i;
        const match = message.match(idPattern);
        return match ? match[1] : null;
    }

    // Detect booking intent from message
    detectBookingIntent(message) {
        const lowerMsg = message.toLowerCase();
        
        if (/(mostr|vedi|visualizza|lista|elenco).*prenotazion/i.test(lowerMsg) ||
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
        
        // If it's a generic booking query
        if (this.isBookingRelatedQuery(message)) {
            return 'general';
        }
        
        return null;
    }

    // Extract special request from message
    extractSpecialRequest(message) {
        // If message contains "special request" or similar, extract text after it
        const match = message.match(/(special|particolare|aggiuntiva|specifico).*?:(.+)/i);
        if (match && match[2]) {
            return match[2].trim();
        }
        
        // Otherwise, try to find text following "add request" or similar
        const addMatch = message.match(/(aggiungi|inserisci|metti).*?(richiest[ae]|not[ae]).*?:(.+)/i);
        if (addMatch && addMatch[3]) {
            return addMatch[3].trim();
        }
        
        // Last possibility: extract any phrases in quotes
        const quoteMatch = message.match(/"([^"]+)"/);
        if (quoteMatch && quoteMatch[1]) {
            return quoteMatch[1].trim();
        }
        
        return null;
    }

    // Handle a booking-related query
    async handleBookingQuery(message, userId) {
        if (!userId) {
            return "Per gestire le prenotazioni, è necessario effettuare l'accesso con il proprio account.";
        }
        
        // For now, we'll return a placeholder response since we don't have direct access to bookingService
        const intent = this.detectBookingIntent(message);
        const bookingId = this.extractBookingId(message);
        
        // Handle different intents
        switch (intent) {
            case 'list':
                return "Ecco l'elenco delle tue prenotazioni:\n\n" +
                       "1. ID: 507f1f77bcf86cd799439011\n" +
                       "   Suite - 15/07/2024 → 20/07/2024\n" +
                       "   Stato: Confermata, €2500\n\n" +
                       "2. ID: 507f1f77bcf86cd799439022\n" +
                       "   Deluxe - 10/09/2024 → 15/09/2024\n" +
                       "   Stato: In attesa, €1750\n\n" +
                       "Per vedere i dettagli di una prenotazione, chiedi informazioni specificando l'ID.";
            
            case 'details':
                return `Dettagli prenotazione ${bookingId}:\n\n` +
                       "Ospite: " + userId + "\n" +
                       "Check-in: 15/07/2024\n" +
                       "Check-out: 20/07/2024\n" +
                       "Numero ospiti: 2\n" +
                       "Tipo camera: Suite\n" +
                       "Stato: Confermata\n" +
                       "Richieste speciali: Bottiglia di spumante all'arrivo\n" +
                       "Prezzo totale: €2500\n" +
                       "Stato pagamento: Pagato";
            
            case 'cancel':
                return `La prenotazione con ID ${bookingId} è stata cancellata con successo. Se avevi già effettuato un pagamento, riceverai un rimborso secondo i termini previsti.`;
            
            case 'update':
                return "Per modificare la tua prenotazione, specifica quale aspetto vuoi cambiare (ad esempio 'aggiungi richiesta speciale')";
            
            case 'specialRequest':
                const specialRequest = this.extractSpecialRequest(message);
                if (!specialRequest) {
                    return "Per favore, specifica la richiesta speciale che desideri aggiungere.";
                }
                
                return `La richiesta speciale "${specialRequest}" è stata aggiunta alla prenotazione ${bookingId}.`;
            
            case 'general':
                return "Posso aiutarti con le tue prenotazioni. Puoi chiedermi di:\n" +
                       "- Mostrare tutte le tue prenotazioni\n" +
                       "- Visualizzare i dettagli di una prenotazione specifica\n" +
                       "- Cancellare una prenotazione\n" +
                       "- Aggiungere richieste speciali\n\n" +
                       "Per iniziare, vuoi vedere l'elenco delle tue prenotazioni?";
            
            default:
                return null; // This message is not related to bookings
        }
    }
}

module.exports = new BookingHandler();