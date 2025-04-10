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
        if (!message || typeof message !== 'string') {
            return false;
        }
        
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
        if (!message || typeof message !== 'string') {
            return false;
        }
        
        console.log('Checking if message is restaurant info request:', message);
        const lowerMsg = message.toLowerCase();
        
        // Lista estesa di parole chiave per il ristorante
        const restaurantKeywords = [
            'ristorante', 'cena', 'pranzo', 'orari', 'menu', 'piatti', 'mangiare', 
            'cucina', 'chef', 'cuoco', 'specialità', 'colazione', 'quando', 'aperto',
            'apre', 'chiude', 'ora', 'orario', 'apertura', 'chiusura', 'bistrot', 'trattoria',
            'cibo', 'mangiar', 'pranzare', 'cenare', 'prenotazione', 'tavolo'
        ];
        
        // Lista di frasi comuni per le richieste di orari
        const timeQuestions = [
            'quali sono gli orari',
            'a che ora apre',
            'a che ora chiude',
            'quando è aperto',
            'fino a che ora',
            'orario di apertura',
            'orario di chiusura',
            'quando posso mangiare',
        ];
        
        // Controlla se è una domanda diretta sugli orari
        const isDirectTimeQuestion = timeQuestions.some(question => lowerMsg.includes(question));
        if (isDirectTimeQuestion) {
            console.log('Direct time question detected');
            return true;
        }
        
        // Controlla parole chiave generali sul ristorante
        const isRestaurantQuestion = restaurantKeywords.some(keyword => lowerMsg.includes(keyword)) && !this.isRestaurantBookingRequest(message);
        
        console.log('Restaurant question detected:', isRestaurantQuestion);
        return isRestaurantQuestion;
    }
    
    /**
     * Handles restaurant requests
     * @param {string} message - User message
     * @returns {string} - Response
     */
    handleRestaurantRequest(message) {
        console.log('Handling restaurant request:', message);
        const lowerMsg = message.toLowerCase();
        
        // Lista di frasi per richieste di orari
        const timeQuestions = [
            'quali sono gli orari',
            'a che ora apre',
            'a che ora chiude',
            'quando è aperto',
            'fino a che ora',
            'orario di apertura',
            'orario di chiusura',
            'quando posso mangiare',
            'orari del ristorante',
            'orari ristorante'
        ];
        
        // Se è una richiesta diretta di prenotazione
        if (lowerMsg.includes('prenota') || lowerMsg.includes('prenotare') || 
            lowerMsg.includes('riservare') || lowerMsg.includes('vorrei un tavolo')) {
            console.log('Detected as booking request');
            return this.getBookingResponse();
        }
        
        // Se è una richiesta per gli orari del ristorante
        if (timeQuestions.some(q => lowerMsg.includes(q)) || 
            lowerMsg.includes('orari') || 
            lowerMsg.includes('quando') && (lowerMsg.includes('aperto') || lowerMsg.includes('ristorante')) || 
            lowerMsg.includes('a che ora')) {
            console.log('Detected as hours request');
            return this.getHoursResponse();
        }
        
        // Se è una richiesta sul menu o sui piatti
        if (lowerMsg.includes('menu') || lowerMsg.includes('piatti') || 
            lowerMsg.includes('specialità') || (lowerMsg.includes('cosa') && lowerMsg.includes('mangiare')) ||
            lowerMsg.includes('carta') || lowerMsg.includes('prezzi')) {
            console.log('Detected as menu request');
            return this.getMenuResponse();
        }
        
        // Risposta generica per altre richieste relative al ristorante
        console.log('Using general restaurant response');
        return this.getGeneralResponse();
    }
    
    // Helper methods for specific response types
    getBookingResponse() {
        // Use data from JSON if available
        const telefono = this.restaurantData?.prenotazioni?.telefono || 'numero interno 122';
        const email = this.restaurantData?.prenotazioni?.email || 'ristorante@villapetriolo.com';
        
        return "Sarei felice di aiutarla con la prenotazione al nostro ristorante. " +
               "Per procedere, avrei bisogno delle seguenti informazioni:\n\n" +
               "- Data e orario desiderati\n" +
               "- Numero di persone\n" +
               "- Eventuali richieste speciali (es. tavolo all'aperto, menu per celiaci, ecc.)\n\n" +
               "Potrebbe fornirmi questi dettagli? In alternativa, posso anche metterla in contatto " +
               `direttamente con il nostro staff di ristorazione al ${telefono} o via email a ` +
               `${email}`;
    }
    
    getHoursResponse() {
        console.log('Restaurant data:', JSON.stringify(this.restaurantData));
        
        // Always use data from JSON, with fallbacks for each field
        const giorni = this.restaurantData?.orari?.giorni_apertura || 'tutti i giorni';
        const pranzo = this.restaurantData?.orari?.pranzo || '12:30 - 14:30';
        const cena = this.restaurantData?.orari?.cena || '19:30 - 22:30';
        const telefono = this.restaurantData?.prenotazioni?.telefono || 'numero interno 122';
        const email = this.restaurantData?.prenotazioni?.email || 'ristorante@villapetriolo.com';
        
        try {
            return `Il nostro ristorante è aperto ${giorni} con i seguenti orari:\n\n` +
                  "ORARI:\n" +
                  `- Pranzo: ${pranzo}\n` +
                  `- Cena: ${cena}\n\n` +
                  "Le prenotazioni sono consigliate, specialmente per la cena. " +
                  `Può prenotare al ${telefono} o via email a ${email}.`;
        } catch (error) {
            console.error('Error generating restaurant hours response:', error);
            // Fallback response with hardcoded values if anything goes wrong
            return `Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n\n` +
                  "ORARI:\n" +
                  `- Pranzo: 12:30 - 14:30\n` +
                  `- Cena: 19:30 - 22:30\n\n` +
                  "Le prenotazioni sono consigliate, specialmente per la cena. " +
                  `Può prenotare al numero interno 122 o via email a ristorante@villapetriolo.com.`;
        }
    }
    
    getMenuResponse() {
        console.log('Menu data:', JSON.stringify(this.restaurantData.menu || {}));
        
        // Always build from JSON data with fallbacks for missing sections
        let menuText = "Ecco il nostro menu attuale:\n\n";
        
        // Define default menu items in case the JSON data is missing
        const defaultMenu = {
            antipasti: [
                {nome: "Carpaccio di manzo con scaglie di parmigiano", prezzo: 16},
                {nome: "Burrata con pomodorini e basilico", prezzo: 14},
                {nome: "Tagliere di salumi e formaggi toscani", prezzo: 18}
            ],
            primi: [
                {nome: "Pappardelle al ragù di cinghiale", prezzo: 18},
                {nome: "Risotto ai funghi porcini", prezzo: 16},
                {nome: "Spaghetti alle vongole", prezzo: 18}
            ],
            secondi: [
                {nome: "Bistecca alla fiorentina (per 2 persone)", prezzo: 70},
                {nome: "Filetto di branzino con verdure di stagione", prezzo: 24},
                {nome: "Tagliata di manzo con rucola e parmigiano", prezzo: 26}
            ],
            dolci: [
                {nome: "Tiramisù della casa", prezzo: 8},
                {nome: "Panna cotta ai frutti di bosco", prezzo: 8},
                {nome: "Cantucci e Vin Santo", prezzo: 10}
            ]
        };
        
        // Use data from JSON if available, otherwise use default
        const menu = this.restaurantData?.menu || defaultMenu;
        
        // Build menu sections
        const sections = [
            { name: "ANTIPASTI", items: menu.antipasti || defaultMenu.antipasti },
            { name: "PRIMI", items: menu.primi || defaultMenu.primi },
            { name: "SECONDI", items: menu.secondi || defaultMenu.secondi },
            { name: "DOLCI", items: menu.dolci || defaultMenu.dolci }
        ];
        
        sections.forEach(section => {
            if (section.items && section.items.length > 0) {
                menuText += `${section.name}:\n`;
                section.items.forEach(item => {
                    // Check property names (nome/name, prezzo/price)
                    const nome = item.nome || item.name || 'Piatto';
                    const prezzo = item.prezzo || item.price || 0;
                    menuText += `- ${nome} (€${prezzo})\n`;
                });
                menuText += "\n";
            }
        });
        
        menuText += "Il menu può variare leggermente in base alla stagionalità degli ingredienti.";
        return menuText;
    }
    
    getGeneralResponse() {
        console.log('General restaurant data:', JSON.stringify(this.restaurantData || {}));
        
        let generalResponse = "";
        
        // Get orari data with fallbacks
        const giorni = this.restaurantData?.orari?.giorni_apertura || 'tutti i giorni';
        const pranzo = this.restaurantData?.orari?.pranzo || '12:30 - 14:30';
        const cena = this.restaurantData?.orari?.cena || '19:30 - 22:30';
        const telefono = this.restaurantData?.prenotazioni?.telefono || 'numero interno 122';
        const email = this.restaurantData?.prenotazioni?.email || 'ristorante@villapetriolo.com';
        
        // Check if we have English format data
        if (this.restaurantData?.openingHours) {
            const lunchStart = this.restaurantData.openingHours?.lunch?.start || '12:30';
            const lunchEnd = this.restaurantData.openingHours?.lunch?.end || '14:30';
            const dinnerStart = this.restaurantData.openingHours?.dinner?.start || '19:30';
            const dinnerEnd = this.restaurantData.openingHours?.dinner?.end || '22:30';
            
            generalResponse += `Il nostro ristorante è aperto ${giorni} con i seguenti orari:\n`;
            generalResponse += `- Pranzo: ${lunchStart} - ${lunchEnd}\n`;
            generalResponse += `- Cena: ${dinnerStart} - ${dinnerEnd}\n`;
        } else {
            // Use Italian format data
            generalResponse += `Il nostro ristorante è aperto ${giorni} con i seguenti orari:\n`;
            generalResponse += `- Pranzo: ${pranzo}\n`;
            generalResponse += `- Cena: ${cena}\n`;
        }
        
        // Descrizione
        generalResponse += "\nOffriamo una cucina tradizionale toscana con prodotti freschi e locali. " +
                           "Il nostro chef propone un menu che include specialità come pappardelle al cinghiale, " +
                           "bistecca alla fiorentina e una selezione di dolci fatti in casa.\n\n";
        
        // Contatti
        generalResponse += `Per prenotazioni può contattarci al ${telefono} o via email a ${email}.`;
        
        return generalResponse;
    }
}

module.exports = RestaurantHandler;