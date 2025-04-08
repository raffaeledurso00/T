// src/services/mistral/handlers/EventsHandler.js

class EventsHandler {
    constructor() {
        // Initialization if needed
    }
    
    /**
     * Identifies event information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's an events info request
     */
    isEventsInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const eventsKeywords = [
            'eventi', 'programma', 'concerto', 'spettacolo', 'degustazione', 'festa', 
            'calendario', 'cosa c\'è', 'cosa succede', 'intrattenimento', 'serata'
        ];
        
        return eventsKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    /**
     * Handles event requests
     * @param {string} message - User message
     * @returns {string} - Response about events
     */
    handleEventsRequest(message) {
        const lowerMsg = message.toLowerCase();
        let eventsResponse = "Ecco gli eventi in programma:\n\n";
        
        // Regular events
        eventsResponse += this.getRegularEventsInfo();
        
        // Special events (if explicitly requested or as part of a complete response)
        if (lowerMsg.includes('special') || lowerMsg.includes('tutt')) {
            eventsResponse += this.getSpecialEventsInfo();
        }
        
        return eventsResponse + "Per ulteriori informazioni o prenotazioni, contatti la reception.";
    }
    
    // Helper methods
    getRegularEventsInfo() {
        return `EVENTI REGOLARI:\n` +
               `- Serata di degustazione olio d'oliva: degustazione guidata degli oli prodotti nella tenuta\n` +
               `  Quando: ogni martedì, Orario: 19:00 - 20:30, Luogo: Sala degustazione\n` +
               `  Prezzo: €25, Prenotazione: richiesta\n\n` +
               `- Concerto di musica dal vivo: musica jazz e classica con artisti locali\n` +
               `  Quando: ogni venerdì, Orario: 21:00 - 23:00, Luogo: Terrazza panoramica\n` +
               `  Prezzo: €15, Prenotazione: consigliata\n\n` +
               `- Aperitivo al tramonto: aperitivo con vista panoramica sulle colline toscane\n` +
               `  Quando: ogni giorno, Orario: 18:30 - 20:00, Luogo: Bar della piscina\n` +
               `  Prezzo: €20, Prenotazione: non necessaria\n\n`;
    }
    
    getSpecialEventsInfo() {
        return `EVENTI SPECIALI:\n` +
               `- Festival del Vino: un weekend dedicato ai migliori vini della Toscana\n` +
               `  Quando: primo weekend di ogni mese, Durata: 3 giorni\n` +
               `  Luogo: Cantina e giardini della villa\n` +
               `  Prezzo: €75, Prenotazione: richiesta con anticipo\n\n` +
               `- Cooking Masterclass: masterclass con chef stellati ospiti\n` +
               `  Quando: ultimo sabato del mese, Orario: 10:00 - 15:00\n` +
               `  Luogo: Cucina professionale\n` +
               `  Prezzo: €120, Prenotazione: obbligatoria con anticipo\n\n`;
    }
}

module.exports = EventsHandler;