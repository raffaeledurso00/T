// src/services/mistral/handlers/EventsHandler.js

class EventsHandler {
    constructor(eventsData) {
        this.eventsData = eventsData || {};
    }
    
    /**
     * Identifies event information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's an events info request
     */
    isEventsInfoRequest(message) {
        if (!message || typeof message !== 'string') {
            return false;
        }
        
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
        // Check if we have events data, if not use default data
        if (!this.eventsData || Object.keys(this.eventsData).length === 0) {
            this.eventsData = {
                "eventi": [
                    {
                        "nome": "Serata di degustazione olio d'oliva",
                        "descrizione": "Degustazione guidata degli oli di oliva prodotti nella nostra tenuta",
                        "data": "ogni martedì",
                        "orario": "19:00 - 20:30",
                        "luogo": "Sala degustazione",
                        "prezzo": 25,
                        "prenotazione": "richiesta"
                    },
                    {
                        "nome": "Concerto di musica dal vivo",
                        "descrizione": "Musica jazz e classica dal vivo con artisti locali",
                        "data": "ogni venerdì",
                        "orario": "21:00 - 23:00",
                        "luogo": "Terrazza panoramica",
                        "prezzo": 15,
                        "prenotazione": "consigliata"
                    },
                    {
                        "nome": "Aperitivo al tramonto",
                        "descrizione": "Aperitivo con vista panoramica sulle colline toscane",
                        "data": "ogni giorno",
                        "orario": "18:30 - 20:00",
                        "luogo": "Bar della piscina",
                        "prezzo": 20,
                        "prenotazione": "non necessaria"
                    },
                    {
                        "nome": "Cena tematica regionale",
                        "descrizione": "Cena con menu speciale dedicato alle regioni d'Italia",
                        "data": "ogni sabato",
                        "orario": "20:00 - 22:30",
                        "luogo": "Ristorante principale",
                        "prezzo": 50,
                        "prenotazione": "richiesta"
                    }
                ],
                "eventi_speciali": [
                    {
                        "nome": "Festival del Vino",
                        "descrizione": "Un weekend dedicato ai migliori vini della Toscana con degustazioni e workshop",
                        "data": "primo weekend di ogni mese",
                        "durata": "3 giorni",
                        "luogo": "Cantina e giardini della villa",
                        "prezzo": 75,
                        "prenotazione": "richiesta con anticipo"
                    },
                    {
                        "nome": "Cooking Masterclass",
                        "descrizione": "Masterclass con chef stellati ospiti",
                        "data": "ultimo sabato del mese",
                        "orario": "10:00 - 15:00",
                        "luogo": "Cucina professionale",
                        "prezzo": 120,
                        "prenotazione": "obbligatoria con anticipo"
                    }
                ]
            };
            console.log('[EventsHandler] Using default events data');
        }
        
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
        // Always use data from JSON
        if (this.eventsData.eventi && this.eventsData.eventi.length > 0) {
            let response = `EVENTI REGOLARI:\n`;
            
            this.eventsData.eventi.forEach(evento => {
                response += `- ${evento.nome}: ${evento.descrizione}\n`;
                let dettagli = [];
                if (evento.data) dettagli.push(`Quando: ${evento.data}`);
                if (evento.orario) dettagli.push(`Orario: ${evento.orario}`);
                if (evento.luogo) dettagli.push(`Luogo: ${evento.luogo}`);
                
                if (dettagli.length > 0) {
                    response += `  ${dettagli.join(', ')}\n`;
                }
                
                if (evento.prezzo) {
                    response += `  Prezzo: €${evento.prezzo}`;
                }
                
                if (evento.prenotazione) {
                    response += `, Prenotazione: ${evento.prenotazione}`;
                }
                
                response += "\n\n";
            });
            
            return response;
        }
        
        // Fallback with empty data
        return "";
    }
    
    getSpecialEventsInfo() {
        // Always use data from JSON
        if (this.eventsData.eventi_speciali && this.eventsData.eventi_speciali.length > 0) {
            let response = `EVENTI SPECIALI:\n`;
            
            this.eventsData.eventi_speciali.forEach(evento => {
                response += `- ${evento.nome}: ${evento.descrizione}\n`;
                let dettagli = [];
                if (evento.data) dettagli.push(`Quando: ${evento.data}`);
                if (evento.durata) dettagli.push(`Durata: ${evento.durata}`);
                if (evento.orario) dettagli.push(`Orario: ${evento.orario}`);
                
                if (dettagli.length > 0) {
                    response += `  ${dettagli.join(', ')}\n`;
                }
                
                if (evento.luogo) {
                    response += `  Luogo: ${evento.luogo}\n`;
                }
                
                if (evento.prezzo) {
                    response += `  Prezzo: €${evento.prezzo}`;
                }
                
                if (evento.prenotazione) {
                    response += `, Prenotazione: ${evento.prenotazione}`;
                }
                
                response += "\n\n";
            });
            
            return response;
        }
        
        // Fallback with empty data
        return "";
    }
}

module.exports = EventsHandler;