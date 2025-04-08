// src/services/mistral/handlers/ServicesHandler.js

class ServicesHandler {
    constructor() {
        // Initialization if needed
    }
    
    /**
     * Identifies service information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's a services info request
     */
    isServicesInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const servicesKeywords = [
            'servizi', 'servizio', 'wifi', 'internet', 'parcheggio', 'reception', 
            'pulizia', 'navetta', 'trasporto', 'spa', 'massaggio', 'benessere', 'piscina'
        ];
        
        return servicesKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    /**
     * Handles service requests
     * @param {string} message - User message
     * @returns {string} - Response about services
     */
    handleServicesRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // Hotel services response
        if (lowerMsg.includes('hotel') || lowerMsg.includes('struttura') ||
            lowerMsg.includes('recept') || lowerMsg.includes('camere')) {
            return this.getHotelServicesInfo();
        }
        
        // Wellness services response
        if (lowerMsg.includes('benesser') || lowerMsg.includes('spa') ||
            lowerMsg.includes('massagg') || lowerMsg.includes('relax')) {
            return this.getWellnessServicesInfo();
        }
        
        // Extra services response
        if (lowerMsg.includes('extra') || lowerMsg.includes('aggiuntiv') ||
            lowerMsg.includes('trasferimento') || lowerMsg.includes('trasport')) {
            return this.getExtraServicesInfo();
        }
        
        // General response about all services
        return this.getGeneralServicesInfo();
    }
    
    // Helper methods
    getHotelServicesInfo() {
        return `Ecco i servizi principali del nostro hotel:\n\n` +
               `- Reception: servizio di accoglienza e assistenza agli ospiti disponibile 24 ore su 24\n\n` +
               `- Servizio in camera: servizio di ristorazione in camera (orari: 7:00 - 23:00)\n\n` +
               `- Concierge: assistenza per prenotazioni, informazioni e servizi personalizzati (orari: 8:00 - 22:00)\n\n` +
               `- Pulizia camere: servizio di pulizia giornaliera delle camere (orari: 9:00 - 14:00)\n\n` +
               `- Wi-Fi: connessione gratuita in tutta la struttura\n\n` +
               `- Parcheggio: parcheggio gratuito per gli ospiti\n\n`;
    }
    
    getWellnessServicesInfo() {
        return `Ecco i nostri servizi benessere:\n\n` +
               `- Spa e centro benessere: sauna, bagno turco, piscina interna riscaldata e area relax\n` +
               `  Orari: 10:00 - 20:00\n` +
               `  Prezzo: accesso incluso per gli ospiti, trattamenti a pagamento\n\n` +
               `- Massaggi: rilassante, decontratturante, aromaterapico\n` +
               `  Orari: 11:00 - 19:00\n` +
               `  Prezzo: da €60 per 50 minuti, prenotazione richiesta\n\n` +
               `- Trattamenti viso: trattamenti viso personalizzati\n` +
               `  Orari: 11:00 - 19:00\n` +
               `  Prezzo: da €45 per 30 minuti, prenotazione richiesta\n\n` +
               `- Piscina esterna: con vista sulle colline\n` +
               `  Orari: 8:00 - 19:00 (maggio-settembre)\n` +
               `  Prezzo: incluso nel soggiorno\n\n`;
    }
    
    getExtraServicesInfo() {
        return `Ecco i servizi extra disponibili:\n\n` +
               `- Trasferimento aeroporto: servizio da/per gli aeroporti di Firenze e Pisa\n` +
               `  Prezzo: da €80 a tratta, prenotazione richiesta con 24 ore di anticipo\n\n` +
               `- Noleggio biciclette: biciclette tradizionali ed elettriche\n` +
               `  Orari: 9:00 - 18:00\n` +
               `  Prezzo: €15 all'ora o €45 al giorno, prenotazione consigliata\n\n` +
               `- Servizio lavanderia: lavaggio e stiratura dei capi\n` +
               `  Orari: 8:00 - 17:00\n` +
               `  Prezzo: secondo listino in camera\n\n` +
               `- Baby sitting: su richiesta\n` +
               `  Prezzo: €25 all'ora, prenotazione richiesta con 24 ore di anticipo\n\n`;
    }
    
    getGeneralServicesInfo() {
        return `Ecco i principali servizi disponibili presso Villa Petriolo:\n\n` +
               `SERVIZI HOTEL:\n` +
               `- Reception (24 ore)\n` +
               `- Servizio in camera (7:00 - 23:00)\n` +
               `- Wi-Fi gratuito in tutta la struttura\n\n` +
               `SERVIZI BENESSERE:\n` +
               `- Spa e centro benessere (10:00 - 20:00)\n` +
               `- Massaggi (11:00 - 19:00)\n` +
               `- Piscina esterna (8:00 - 19:00, maggio-settembre)\n\n` +
               `Per ulteriori dettagli o per prenotare un servizio, non esiti a contattare la reception.`;
    }
}

module.exports = ServicesHandler;