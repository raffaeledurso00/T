// src/services/mistral/handlers/ServicesHandler.js

class ServicesHandler {
    constructor(servicesData) {
        this.servicesData = servicesData || {};
    }
    
    /**
     * Identifies service information requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's a services info request
     */
    isServicesInfoRequest(message) {
        if (!message || typeof message !== 'string') {
            return false;
        }
        
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
        // Check if we have services data, if not use default data
        if (!this.servicesData || Object.keys(this.servicesData).length === 0) {
            this.servicesData = {
                "servizi_hotel": [
                    {
                        "nome": "Reception",
                        "orari": "24 ore su 24",
                        "descrizione": "Servizio di accoglienza e assistenza agli ospiti disponibile 24 ore su 24"
                    },
                    {
                        "nome": "Servizio in camera",
                        "orari": "7:00 - 23:00",
                        "descrizione": "Servizio di ristorazione in camera"
                    },
                    {
                        "nome": "Concierge",
                        "orari": "8:00 - 22:00",
                        "descrizione": "Assistenza per prenotazioni, informazioni e servizi personalizzati"
                    },
                    {
                        "nome": "Pulizia camere",
                        "orari": "9:00 - 14:00",
                        "descrizione": "Servizio di pulizia giornaliera delle camere"
                    },
                    {
                        "nome": "Wi-Fi",
                        "orari": "24 ore su 24",
                        "descrizione": "Connessione Wi-Fi gratuita in tutta la struttura"
                    },
                    {
                        "nome": "Parcheggio",
                        "orari": "24 ore su 24",
                        "descrizione": "Parcheggio gratuito per gli ospiti"
                    }
                ],
                "servizi_benessere": [
                    {
                        "nome": "Spa e centro benessere",
                        "orari": "10:00 - 20:00",
                        "descrizione": "Centro benessere con sauna, bagno turco, piscina interna riscaldata e area relax",
                        "prezzo": "Accesso incluso per gli ospiti, trattamenti a pagamento",
                        "prenotazione": "Richiesta per i trattamenti"
                    },
                    {
                        "nome": "Massaggi",
                        "orari": "11:00 - 19:00",
                        "descrizione": "Vari tipi di massaggi: rilassante, decontratturante, aromaterapico",
                        "prezzo": "da 60€ per 50 minuti",
                        "prenotazione": "Richiesta con almeno 4 ore di anticipo"
                    },
                    {
                        "nome": "Trattamenti viso",
                        "orari": "11:00 - 19:00",
                        "descrizione": "Trattamenti viso personalizzati",
                        "prezzo": "da 45€ per 30 minuti",
                        "prenotazione": "Richiesta"
                    },
                    {
                        "nome": "Piscina esterna",
                        "orari": "8:00 - 19:00 (maggio-settembre)",
                        "descrizione": "Piscina esterna con vista sulle colline",
                        "prezzo": "Incluso nel soggiorno",
                        "prenotazione": "Non necessaria"
                    }
                ],
                "servizi_extra": [
                    {
                        "nome": "Trasferimento aeroporto",
                        "descrizione": "Servizio di trasferimento da/per gli aeroporti di Firenze e Pisa",
                        "prezzo": "da 80€ a tratta",
                        "prenotazione": "Richiesta con 24 ore di anticipo"
                    },
                    {
                        "nome": "Noleggio biciclette",
                        "orari": "9:00 - 18:00",
                        "descrizione": "Noleggio di biciclette tradizionali ed elettriche",
                        "prezzo": "15€ all'ora o 45€ al giorno",
                        "prenotazione": "Consigliata"
                    },
                    {
                        "nome": "Servizio lavanderia",
                        "orari": "8:00 - 17:00",
                        "descrizione": "Servizio di lavaggio e stiratura dei capi",
                        "prezzo": "Secondo listino in camera",
                        "prenotazione": "Non necessaria"
                    },
                    {
                        "nome": "Baby sitting",
                        "descrizione": "Servizio di baby sitting su richiesta",
                        "prezzo": "25€ all'ora",
                        "prenotazione": "Richiesta con 24 ore di anticipo"
                    }
                ]
            };
            console.log('[ServicesHandler] Using default services data');
        }
        
        if (!message || typeof message !== 'string') {
            return "Mi dispiace, non ho capito la sua richiesta sui servizi.";
        }
        
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
        // Use JSON data for hotel services
        if (this.servicesData.servizi_hotel && this.servicesData.servizi_hotel.length > 0) {
            let response = `Ecco i servizi principali del nostro hotel:\n\n`;
            
            this.servicesData.servizi_hotel.forEach(servizio => {
                response += `- ${servizio.nome}: ${servizio.descrizione}\n`;
                if (servizio.orari) {
                    response += `  Orari: ${servizio.orari}\n`;
                }
                response += `\n`;
            });
            
            return response;
        }
        
        // Fallback with empty data
        return "Informazioni sui servizi dell'hotel non disponibili al momento.";
    }
    
    getWellnessServicesInfo() {
        // Use JSON data for wellness services
        if (this.servicesData.servizi_benessere && this.servicesData.servizi_benessere.length > 0) {
            let response = `Ecco i nostri servizi benessere:\n\n`;
            
            this.servicesData.servizi_benessere.forEach(servizio => {
                response += `- ${servizio.nome}: ${servizio.descrizione}\n`;
                
                if (servizio.orari) {
                    response += `  Orari: ${servizio.orari}\n`;
                }
                
                if (servizio.prezzo) {
                    response += `  Prezzo: ${servizio.prezzo}\n`;
                }
                
                if (servizio.prenotazione) {
                    response += `  Prenotazione: ${servizio.prenotazione}\n`;
                }
                
                response += `\n`;
            });
            
            return response;
        }
        
        // Fallback with empty data
        return "Informazioni sui servizi benessere non disponibili al momento.";
    }
    
    getExtraServicesInfo() {
        // Use JSON data for extra services
        if (this.servicesData.servizi_extra && this.servicesData.servizi_extra.length > 0) {
            let response = `Ecco i servizi extra disponibili:\n\n`;
            
            this.servicesData.servizi_extra.forEach(servizio => {
                response += `- ${servizio.nome}: ${servizio.descrizione}\n`;
                
                if (servizio.orari) {
                    response += `  Orari: ${servizio.orari}\n`;
                }
                
                if (servizio.prezzo) {
                    response += `  Prezzo: ${servizio.prezzo}\n`;
                }
                
                if (servizio.prenotazione) {
                    response += `  Prenotazione: ${servizio.prenotazione}\n`;
                }
                
                response += `\n`;
            });
            
            return response;
        }
        
        // Fallback with empty data
        return "Informazioni sui servizi extra non disponibili al momento.";
    }
    
    getGeneralServicesInfo() {
        let response = `Ecco i principali servizi disponibili presso Villa Petriolo:\n\n`;
        
        // Add hotel services
        if (this.servicesData.servizi_hotel && this.servicesData.servizi_hotel.length > 0) {
            response += `SERVIZI HOTEL:\n`;
            
            // Show only a few key services in the summary
            this.servicesData.servizi_hotel.slice(0, 3).forEach(servizio => {
                if (servizio.orari) {
                    response += `- ${servizio.nome} (${servizio.orari})\n`;
                } else {
                    response += `- ${servizio.nome}\n`;
                }
            });
            
            response += `\n`;
        }
        
        // Add wellness services
        if (this.servicesData.servizi_benessere && this.servicesData.servizi_benessere.length > 0) {
            response += `SERVIZI BENESSERE:\n`;
            
            // Show only a few key services in the summary
            this.servicesData.servizi_benessere.slice(0, 3).forEach(servizio => {
                if (servizio.orari) {
                    response += `- ${servizio.nome} (${servizio.orari})\n`;
                } else {
                    response += `- ${servizio.nome}\n`;
                }
            });
            
            response += `\n`;
        }
        
        // Add extra services if we still have space (for a shorter response)
        if (this.servicesData.servizi_extra && this.servicesData.servizi_extra.length > 0) {
            response += `SERVIZI EXTRA:\n`;
            
            // Show only the first extra service in the summary
            const servizio = this.servicesData.servizi_extra[0];
            response += `- ${servizio.nome}\n`;
            
            response += `\n`;
        }
        
        response += `Per ulteriori dettagli o per prenotare un servizio, non esiti a contattare la reception.`;
        return response;
    }
}

module.exports = ServicesHandler;