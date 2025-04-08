// src/services/mistral/handlers/ActivitiesHandler.js

class ActivitiesHandler {
    constructor(knowledgeBase) {
        this.knowledgeBase = knowledgeBase || { getActivitiesData: () => null };
    }
    
    /**
     * Identifies activity information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's an activities info request
     */
    isActivitiesInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const activityKeywords = [
            'attività', 'fare', 'tour', 'passeggiata', 'escursione', 'visita', 
            'cosa fare', 'divertimento', 'attrazione', 'esperienza', 'visite guidate'
        ];
        
        return activityKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    /**
     * Handles activity requests
     * @param {string} message - User message
     * @returns {string} - Response about activities
     */
    handleActivitiesRequest(message) {
        // Try to get data from knowledgebase first
        const activitiesData = this.knowledgeBase.getActivitiesData();
        
        if (activitiesData && Object.keys(activitiesData).length > 0) {
            console.log('[ActivitiesHandler] Using activities data from knowledgebase');
            return this.handleActivitiesRequestWithKB(message, activitiesData);
        }
        
        // Fallback to hardcoded responses if knowledgebase data is not available
        console.log('[ActivitiesHandler] Activities knowledgebase data unavailable, using fallback');
        return this.handleActivitiesRequestFallback(message);
    }
    
    // Handle activities requests with data from knowledgebase
    handleActivitiesRequestWithKB(message, activitiesData) {
        const lowerMsg = message.toLowerCase();
        
        // Response about activities in the structure
        if (lowerMsg.includes('struttura') || lowerMsg.includes('qui') ||
            lowerMsg.includes('villa')) {
            
            if (activitiesData.nella_struttura && activitiesData.nella_struttura.length > 0) {
                let response = `Ecco le attività disponibili nella nostra struttura:\n\n`;
                
                activitiesData.nella_struttura.forEach(attivita => {
                    response += `- ${attivita.nome}: ${attivita.descrizione}\n`;
                    let dettagli = [];
                    if (attivita.orari) dettagli.push(`Orari: ${attivita.orari}`);
                    if (attivita.durata) dettagli.push(`Durata: ${attivita.durata}`);
                    if (attivita.prezzo) dettagli.push(`Prezzo: €${attivita.prezzo}`);
                    
                    if (dettagli.length > 0) {
                        response += `  ${dettagli.join(', ')}\n`;
                    }
                    
                    if (attivita.prenotazione) {
                        response += `  Prenotazione: ${attivita.prenotazione}\n`;
                    }
                    
                    response += "\n";
                });
                
                response += `Per prenotazioni, si prega di rivolgersi alla reception o contattarci al numero interno 100.`;
                return response;
            }
        }
        
        // Response about activities in the surroundings
        if (lowerMsg.includes('dintorni') || lowerMsg.includes('fuori') ||
            lowerMsg.includes('vicino')) {
            
            if (activitiesData.nei_dintorni && activitiesData.nei_dintorni.length > 0) {
                let response = `Ecco le attività disponibili nei dintorni:\n\n`;
                
                activitiesData.nei_dintorni.forEach(attivita => {
                    response += `- ${attivita.nome}: ${attivita.descrizione}\n`;
                    let dettagli = [];
                    if (attivita.distanza) dettagli.push(`Distanza: ${attivita.distanza}`);
                    if (attivita.durata) dettagli.push(`Durata: ${attivita.durata}`);
                    if (attivita.prezzo) dettagli.push(`Prezzo: €${attivita.prezzo}`);
                    
                    if (dettagli.length > 0) {
                        response += `  ${dettagli.join(', ')}\n`;
                    }
                    
                    if (attivita.prenotazione) {
                        response += `  Prenotazione: ${attivita.prenotazione}\n`;
                    }
                    
                    response += "\n";
                });
                
                response += `Possiamo organizzare il trasporto e le prenotazioni. Contatti la reception per maggiori dettagli.`;
                return response;
            }
        }
        
        // General response about all activities
        let response = `Ecco alcune attività che può fare durante il suo soggiorno:\n\n`;
        
        // Activities in the structure
        if (activitiesData.nella_struttura && activitiesData.nella_struttura.length > 0) {
            response += `NELLA STRUTTURA:\n`;
            
            activitiesData.nella_struttura.slice(0, 3).forEach(attivita => {
                let dettagli = [];
                if (attivita.orari) dettagli.push(attivita.orari);
                if (attivita.prezzo) dettagli.push(`€${attivita.prezzo}`);
                
                response += `- ${attivita.nome} (${dettagli.join(', ')})\n`;
            });
            
            response += "\n";
        }
        
        // Activities in the surroundings
        if (activitiesData.nei_dintorni && activitiesData.nei_dintorni.length > 0) {
            response += `NEI DINTORNI:\n`;
            
            activitiesData.nei_dintorni.slice(0, 3).forEach(attivita => {
                let dettagli = [];
                if (attivita.distanza) dettagli.push(attivita.distanza);
                if (attivita.prezzo) dettagli.push(`€${attivita.prezzo}`);
                
                response += `- ${attivita.nome} (${dettagli.join(', ')})\n`;
            });
            
            response += "\n";
        }
        
        response += `Per ulteriori dettagli su specifiche attività o per prenotazioni, non esiti a chiedere.`;
        return response;
    }
    
    // Fallback method with hardcoded responses for activities
    handleActivitiesRequestFallback(message) {
        const lowerMsg = message.toLowerCase();
        
        // Response about activities in the structure
        if (lowerMsg.includes('struttura') || lowerMsg.includes('qui') ||
            lowerMsg.includes('villa')) {
            return `Ecco le attività disponibili nella nostra struttura:\n\n` +
                   `- Degustazione vini: degustazione guidata dei migliori vini locali con il nostro sommelier\n` +
                   `  Orari: Tutti i giorni alle 17:00, Durata: 90 minuti, Prezzo: €35\n\n` +
                   `- Corso di cucina toscana: impara a preparare piatti tipici con il nostro chef\n` +
                   `  Orari: Lunedì, mercoledì e venerdì alle 10:00, Durata: 3 ore, Prezzo: €65\n\n` +
                   `- Passeggiata guidata nel bosco: esplora i boschi circostanti con una guida naturalistica\n` +
                   `  Orari: Martedì e giovedì alle 9:30, Durata: 2 ore, Prezzo: €20\n\n` +
                   `- Yoga nel parco: sessione di yoga all'aperto nel parco della villa\n` +
                   `  Orari: Tutti i giorni alle 8:00, Durata: 60 minuti, Prezzo: €15\n\n` +
                   `Per prenotazioni, si prega di rivolgersi alla reception o contattarci al numero interno 100.`;
        }
        
        // Response about activities in the surroundings
        if (lowerMsg.includes('dintorni') || lowerMsg.includes('fuori') ||
            lowerMsg.includes('vicino')) {
            return `Ecco le attività disponibili nei dintorni:\n\n` +
                   `- Tour del Chianti: visita delle cantine più rinomate della regione del Chianti\n` +
                   `  Distanza: 30 minuti di auto, Durata: mezza giornata, Prezzo: €85\n\n` +
                   `- Visita a San Gimignano: escursione alla città medievale delle torri\n` +
                   `  Distanza: 45 minuti di auto, Durata: mezza giornata, Prezzo: €60\n\n` +
                   `- Tour in bici delle colline toscane: escursione in bicicletta tra le pittoresche colline\n` +
                   `  Distanza: partenza dalla struttura, Durata: 3-4 ore, Prezzo: €40\n\n` +
                   `- Visita a Firenze: tour guidato della città d'arte\n` +
                   `  Distanza: 1 ora di auto, Durata: giornata intera, Prezzo: €90\n\n` +
                   `Possiamo organizzare il trasporto e le prenotazioni. Contatti la reception per maggiori dettagli.`;
        }
        
        // General response about all activities
        return `Ecco alcune attività che può fare durante il suo soggiorno:\n\n` +
               `NELLA STRUTTURA:\n` +
               `- Degustazione vini (tutti i giorni, €35)\n` +
               `- Corso di cucina toscana (lun, mer, ven, €65)\n` +
               `- Yoga nel parco (ogni mattina, €15)\n\n` +
               `NEI DINTORNI:\n` +
               `- Tour del Chianti (30 minuti di auto, €85)\n` +
               `- Visita a San Gimignano (45 minuti di auto, €60)\n` +
               `- Tour in bici delle colline toscane (€40)\n\n` +
               `Per ulteriori dettagli su specifiche attività o per prenotazioni, non esiti a chiedere.`;
    }
}

module.exports = ActivitiesHandler;