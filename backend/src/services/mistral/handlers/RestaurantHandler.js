// src/services/mistral/handlers/RestaurantHandler.js

class RestaurantHandler {
    constructor(restaurantData) {
        this.restaurantData = restaurantData || {};
    }
    
    /**
     * Identifies restaurant booking requests
     * @param {string} message - User message
     * @returns {boolean} - True if it's a restaurant booking request
     */
    isRestaurantBookingRequest(message) {
        const lowerMsg = message.toLowerCase();
        const restaurantKeywords = [
            'prenota', 'tavolo', 'ristorante', 'cena', 'pranzo', 'mangiare',
            'prenotare', 'riservare', 'posto', 'bistrot', 'stasera', 'domani'
        ];
        
        // Must be a booking request, not just a general question about the restaurant
        const bookingWords = ['prenota', 'prenotare', 'riservare', 'tavolo', 'posto'];
        const hasBookingIntent = bookingWords.some(word => lowerMsg.includes(word));
        
        return hasBookingIntent && restaurantKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    /**
     * Identifies requests for restaurant information (not bookings)
     * @param {string} message - User message
     * @returns {boolean} - True if it's a restaurant info request
     */
    isRestaurantInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const restaurantKeywords = [
            'ristorante', 'cena', 'pranzo', 'orari', 'menu', 'piatti', 'mangiare', 
            'cucina', 'chef', 'cuoco', 'specialità', 'colazione', 'quando', 'aperto'
        ];
        
        // Must contain at least one keyword but not be a booking request
        return restaurantKeywords.some(keyword => lowerMsg.includes(keyword)) && !this.isRestaurantBookingRequest(message);
    }
    
    /**
     * Handles restaurant requests
     * @param {string} message - User message
     * @returns {string} - Response
     */
    handleRestaurantRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // If it's a direct booking request
        if (lowerMsg.includes('prenota') || lowerMsg.includes('prenotare') || 
            lowerMsg.includes('riservare') || lowerMsg.includes('vorrei un tavolo')) {
            return this.getBookingResponse();
        }
        
        // If it's a request for restaurant hours
        if (lowerMsg.includes('orari') || lowerMsg.includes('quando') || 
            lowerMsg.includes('aperto') || lowerMsg.includes('a che ora')) {
            return this.getHoursResponse();
        }
        
        // If it's a request about the menu or dishes
        if (lowerMsg.includes('menu') || lowerMsg.includes('piatti') || 
            lowerMsg.includes('specialità') || lowerMsg.includes('cosa') && lowerMsg.includes('mangiare')) {
            return this.getMenuResponse();
        }
        
        // Generic response for other restaurant-related requests
        return this.getGeneralResponse();
    }
    
    // Helper methods for specific response types
    getBookingResponse() {
        return "Sarei felice di aiutarla con la prenotazione al nostro ristorante. " +
               "Per procedere, avrei bisogno delle seguenti informazioni:\n\n" +
               "- Data e orario desiderati\n" +
               "- Numero di persone\n" +
               "- Eventuali richieste speciali (es. tavolo all'aperto, menu per celiaci, ecc.)\n\n" +
               "Potrebbe fornirmi questi dettagli? In alternativa, posso anche metterla in contatto " +
               "direttamente con il nostro staff di ristorazione al numero interno 122 o via email a " +
               "ristorante@villapetriolo.com";
    }
    
    getHoursResponse() {
        return "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n\n" +
               "ORARI:\n" +
               "- Pranzo: 12:30 - 14:30\n" +
               "- Cena: 19:30 - 22:30\n\n" +
               "Le prenotazioni sono consigliate, specialmente per la cena. " +
               "Può prenotare al numero interno 122 o via email a ristorante@villapetriolo.com.";
    }
    
    getMenuResponse() {
        if (this.restaurantData.menu) {
            let menuText = "Ecco il nostro menu attuale:\n\n";
            
            // Costruisci il menu dalle sezioni disponibili
            const sections = [
                { name: "ANTIPASTI", items: this.restaurantData.menu.antipasti },
                { name: "PRIMI", items: this.restaurantData.menu.primi },
                { name: "SECONDI", items: this.restaurantData.menu.secondi },
                { name: "DOLCI", items: this.restaurantData.menu.dolci }
            ];
            
            sections.forEach(section => {
                if (section.items && section.items.length > 0) {
                    menuText += `${section.name}:\n`;
                    section.items.forEach(item => {
                        menuText += `- ${item.nome} (€${item.prezzo})\n`;
                    });
                    menuText += "\n";
                }
            });
            
            menuText += "Il menu può variare leggermente in base alla stagionalità degli ingredienti.";
            return menuText;
        } else {
            // Fallback al menu hardcoded
            return "Ecco il nostro menu attuale:\n\n" +
                   "ANTIPASTI:\n" +
                   "- Carpaccio di manzo con scaglie di parmigiano (€16)\n" +
                   "- Burrata con pomodorini e basilico (€14)\n" +
                   "- Tagliere di salumi e formaggi toscani (€18)\n\n" +
                   "PRIMI:\n" +
                   "- Pappardelle al ragù di cinghiale (€18)\n" +
                   "- Risotto ai funghi porcini (€16)\n" +
                   "- Spaghetti alle vongole (€18)\n\n" +
                   "SECONDI:\n" +
                   "- Bistecca alla fiorentina (per 2 persone) (€70)\n" +
                   "- Filetto di branzino con verdure di stagione (€24)\n" +
                   "- Tagliata di manzo con rucola e parmigiano (€26)\n\n" +
                   "DOLCI:\n" +
                   "- Tiramisù della casa (€8)\n" +
                   "- Panna cotta ai frutti di bosco (€8)\n" +
                   "- Cantucci e Vin Santo (€10)\n\n" +
                   "Il menu può variare leggermente in base alla stagionalità degli ingredienti.";
        }
    }
    
    getGeneralResponse() {
        let generalResponse = "";
        
        // Orari
        if (this.restaurantData.orari) {
            generalResponse += "Il nostro ristorante è aperto";
            if (this.restaurantData.orari.giorni_apertura) {
                generalResponse += ` ${this.restaurantData.orari.giorni_apertura}`;
            } else {
                generalResponse += " tutti i giorni";
            }
            generalResponse += " con i seguenti orari:\n";
            
            if (this.restaurantData.orari.pranzo) {
                generalResponse += `- Pranzo: ${this.restaurantData.orari.pranzo}\n`;
            }
            if (this.restaurantData.orari.cena) {
                generalResponse += `- Cena: ${this.restaurantData.orari.cena}\n`;
            }
        } else if (this.restaurantData.openingHours) {
            generalResponse += "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n";
            if (this.restaurantData.openingHours.lunch) {
                generalResponse += `- Pranzo: ${this.restaurantData.openingHours.lunch.start} - ${this.restaurantData.openingHours.lunch.end}\n`;
            }
            if (this.restaurantData.openingHours.dinner) {
                generalResponse += `- Cena: ${this.restaurantData.openingHours.dinner.start} - ${this.restaurantData.openingHours.dinner.end}\n`;
            }
        } else {
            generalResponse += "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n" +
                              "- Pranzo: 12:30 - 14:30\n" +
                              "- Cena: 19:30 - 22:30\n";
        }
        
        // Descrizione
        generalResponse += "\nOffriamo una cucina tradizionale toscana con prodotti freschi e locali. " +
                           "Il nostro chef propone un menu che include specialità come pappardelle al cinghiale, " +
                           "bistecca alla fiorentina e una selezione di dolci fatti in casa.\n\n";
        
        // Contatti
        if (this.restaurantData.prenotazioni) {
            generalResponse += "Per prenotazioni può contattarci";
            if (this.restaurantData.prenotazioni.telefono) {
                generalResponse += ` al ${this.restaurantData.prenotazioni.telefono}`;
            }
            if (this.restaurantData.prenotazioni.email) {
                generalResponse += ` o via email a ${this.restaurantData.prenotazioni.email}`;
            }
            generalResponse += ".";
        } else {
            generalResponse += "Per prenotazioni può contattarci al numero interno 122 o via email a ristorante@villapetriolo.com.";
        }
        
        return generalResponse;
    }
}

module.exports = RestaurantHandler;