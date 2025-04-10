// src/services/mistral/handlers/ActivitiesHandler.js

class ActivitiesHandler {
    constructor(activitiesData) {
        this.activitiesData = activitiesData || {};
    }
    
    /**
     * Identifies activity information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's an activities info request
     */
    isActivitiesInfoRequest(message) {
        if (!message || typeof message !== 'string') {
            return false;
        }
        
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
        // Process data from JSON
        return this.processActivitiesRequest(message, this.activitiesData);
    }
    
    // Process activities request using data
    processActivitiesRequest(message, activitiesData) {
        // If activitiesData is empty or undefined, use default data
        if (!activitiesData || Object.keys(activitiesData).length === 0) {
            // Default activities data as fallback
            activitiesData = {
                "nella_struttura": [
                    {
                        "nome": "Degustazione vini",
                        "descrizione": "Degustazione di vini locali con il nostro sommelier esperto",
                        "orari": "Tutti i giorni alle 17:00",
                        "durata": "90 minuti",
                        "prezzo": 35,
                        "prenotazione": "richiesta"
                    },
                    {
                        "nome": "Corso di cucina toscana",
                        "descrizione": "Impara a preparare piatti tipici della tradizione toscana con il nostro chef",
                        "orari": "Lunedì, mercoledì e venerdì alle 10:00",
                        "durata": "3 ore",
                        "prezzo": 65,
                        "prenotazione": "richiesta"
                    },
                    {
                        "nome": "Passeggiata guidata nel bosco",
                        "descrizione": "Esplora i boschi circostanti con una guida naturalistica",
                        "orari": "Martedì e giovedì alle 9:30",
                        "durata": "2 ore",
                        "prezzo": 20,
                        "prenotazione": "richiesta"
                    },
                    {
                        "nome": "Yoga nel parco",
                        "descrizione": "Sessione di yoga all'aperto nel parco della villa",
                        "orari": "Tutti i giorni alle 8:00",
                        "durata": "60 minuti",
                        "prezzo": 15,
                        "prenotazione": "consigliata"
                    }
                ],
                "nei_dintorni": [
                    {
                        "nome": "Tour del Chianti",
                        "descrizione": "Visita delle cantine più rinomate della regione del Chianti",
                        "distanza": "30 minuti di auto",
                        "durata": "mezza giornata",
                        "prezzo": 85,
                        "prenotazione": "richiesta con 24h di anticipo"
                    },
                    {
                        "nome": "Visita a San Gimignano",
                        "descrizione": "Escursione alla città medievale delle torri",
                        "distanza": "45 minuti di auto",
                        "durata": "mezza giornata",
                        "prezzo": 60,
                        "prenotazione": "richiesta con 24h di anticipo"
                    },
                    {
                        "nome": "Tour in bici delle colline toscane",
                        "descrizione": "Escursione in bicicletta tra le pittoresche colline toscane",
                        "distanza": "partenza dalla struttura",
                        "durata": "3-4 ore",
                        "prezzo": 40,
                        "prenotazione": "richiesta"
                    },
                    {
                        "nome": "Visita a Firenze",
                        "descrizione": "Tour guidato della città d'arte",
                        "distanza": "1 ora di auto",
                        "durata": "giornata intera",
                        "prezzo": 90,
                        "prenotazione": "richiesta con 48h di anticipo"
                    }
                ]
            };
            console.log('[ActivitiesHandler] Using default activities data');
        }
        
        if (!message || typeof message !== 'string') {
            return "Mi dispiace, non ho capito la sua richiesta sulle attività.";
        }
        
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
}

module.exports = ActivitiesHandler;