// src/services/mistral/DirectResponseHandler.js
// Un handler diretto per risposte predefinite senza bisogno di parole chiave

class DirectResponseHandler {
    constructor(multiLanguageHandler) {
        this.multiLanguageHandler = multiLanguageHandler;
    }

    /**
     * Determina se un messaggio richiede una risposta diretta sugli orari del ristorante
     * @param {string} message - Messaggio utente
     * @param {string} language - Lingua rilevata
     * @returns {boolean} - true se serve una risposta diretta
     */
    needsRestaurantHoursResponse(message, language) {
        // Per il cinese e il russo, non possiamo fidarci del modello per le risposte
        if (language === 'zh' || language === 'ru') {
            // Quando in queste lingue, rispondiamo in modo diretto
            return true;
        }
        
        // Per le altre lingue, cerchiamo di capire la semantica della richiesta
        // Ipotizziamo qualche controllo di base solo come fallback
        const lowerMsg = message.toLowerCase();
        
        if (language === 'en' && 
            (lowerMsg.includes('restaurant hour') || 
             lowerMsg.includes('open hour') || 
             lowerMsg.includes('when') && lowerMsg.includes('restaurant'))) {
            return true;
        }
        
        if (language === 'it' && 
            (lowerMsg.includes('orari') && lowerMsg.includes('ristorante') || 
             lowerMsg.includes('quando') && lowerMsg.includes('ristorante'))) {
            return true;
        }
        
        return false;
    }

    /**
     * Genera la risposta per gli orari del ristorante
     * @param {string} language - Lingua rilevata
     * @returns {string} - Risposta formattata
     */
    getRestaurantHoursResponse(language) {
        return this.multiLanguageHandler.getRestaurantHoursMessage(language);
    }
}

module.exports = DirectResponseHandler;