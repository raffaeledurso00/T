// backend/src/services/mistral/RestaurantIntegration.js
const MessageDetectionUtils = require('./MessageDetectionUtils');

class RestaurantIntegration {
    constructor() {
        this.messageDetection = new MessageDetectionUtils();
        this.restaurantInfo = {
            name: 'Ristorante Villa Petriolo',
            openingHours: {
                lunch: {
                    start: '12:30',
                    end: '14:30',
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                },
                dinner: {
                    start: '19:30',
                    end: '22:30',
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                }
            }
        };
    }

    // Controlla se il messaggio è relativo al ristorante
    isRestaurantRelatedQuery(message) {
        const restaurantKeywords = [
            'ristorante', 'cenare', 'pranzare', 'cena', 'pranzo', 'tavolo', 
            'prenotare', 'prenotazione', 'menu', 'piatti', 'orari', 'apertura'
        ];
        
        const lowerMsg = message.toLowerCase();
        return restaurantKeywords.some(keyword => lowerMsg.includes(keyword));
    }

    // Determina l'intento dell'utente dal messaggio
    detectRestaurantIntent(message) {
        const lowerMsg = message.toLowerCase();
        
        if (/(prenot|prenotare|riservare|tavolo per).*?/i.test(lowerMsg)) {
            return 'booking';
        }
        
        if (/(menu|piatt|cosa.*?mangiare|cosa.*?pranzare|cosa.*?cenare)/i.test(lowerMsg)) {
            return 'menu';
        }
        
        if (/(orar|quando.*?aperto|apertura|chius)/i.test(lowerMsg)) {
            return 'hours';
        }
        
        if (/(costo|prezzo|quanto costa)/i.test(lowerMsg)) {
            return 'prices';
        }
        
        return 'general';
    }

    // Gestisce una query relativa al ristorante
    handleRestaurantQuery(message) {
        const intent = this.detectRestaurantIntent(message);
        const times = this.messageDetection.extractTime(message);
        const dates = this.messageDetection.extractDate(message);
        const personCount = this.messageDetection.extractPersonCount(message);
        
        switch (intent) {
            case 'booking':
                return this.handleBookingRequest(message, times, dates, personCount);
            
            case 'menu':
                return this.getMenuInformation();
            
            case 'hours':
                return this.getOpeningHours();
            
            case 'prices':
                return this.getPriceInformation();
            
            case 'general':
            default:
                return this.getGeneralInformation();
        }
    }

    // Gestisce una richiesta di prenotazione
    handleBookingRequest(message, times, dates, personCount) {
        let response = "Sarei felice di aiutarla con una prenotazione al nostro ristorante.\n\n";
        
        // Controlla se abbiamo tutte le informazioni necessarie
        const missingInfo = [];
        
        if (dates.length === 0) {
            missingInfo.push("- La data desiderata per la prenotazione");
        }
        
        if (times.length === 0) {
            missingInfo.push("- L'orario preferito");
        }
        
        if (!personCount) {
            missingInfo.push("- Il numero di persone");
        }
        
        // Se mancano informazioni, le richiediamo
        if (missingInfo.length > 0) {
            response += "Per procedere con la prenotazione, avrei bisogno delle seguenti informazioni:\n";
            response += missingInfo.join("\n");
            response += "\n\nPotrebbe gentilmente fornirmi questi dettagli?";
            return response;
        }
        
        // Se abbiamo tutte le informazioni, forniamo assistenza per completare la prenotazione
        const date = dates[0].toLocaleDateString('it-IT');
        const time = times[0].hour + ":" + (times[0].minute < 10 ? "0" : "") + times[0].minute;
        
        response += `Ho preso nota della sua richiesta per ${personCount} ${personCount === 1 ? 'persona' : 'persone'} il giorno ${date} alle ore ${time}.\n\n`;
        response += "Per completare la prenotazione posso:\n";
        response += "1. Chiamare direttamente il ristorante per lei\n";
        response += "2. Metterla in contatto con il nostro staff di ristorazione al numero interno 122\n";
        response += "3. Inoltrare la sua richiesta via email a ristorante@villapetriolo.com\n\n";
        response += "Come preferisce procedere?";
        
        return response;
    }

    // Fornisce informazioni sul menu
    getMenuInformation() {
        return `
MENU DEL RISTORANTE VILLA PETRIOLO

ANTIPASTI:
Tagliere di salumi toscani con crostini - €18
Burrata con pomodorini e basilico - €16
Carpaccio di manzo con rucola e parmigiano - €19
Crostini misti toscani - €14

PRIMI:
Pappardelle al cinghiale - €22
Risotto ai funghi porcini - €24
Ribollita toscana - €18
Tagliolini al tartufo - €26

SECONDI:
Bistecca alla fiorentina (prezzo al 100g) - €8
Cinghiale in umido con olive - €28
Filetto di branzino alle erbe - €30
Tagliata di manzo con rucola e parmigiano - €26

DOLCI:
Panna cotta con frutti di bosco - €12
Cantucci e Vin Santo - €14
Torta al cioccolato con gelato - €13
Tiramisù della casa - €12

Per prenotazioni o informazioni, può contattare il ristorante all'interno 122 o via email a ristorante@villapetriolo.com.
        `.trim();
    }

    // Fornisce informazioni sugli orari di apertura
    getOpeningHours() {
        return `
ORARI DI APERTURA DEL RISTORANTE VILLA PETRIOLO

Siamo aperti tutti i giorni con i seguenti orari:

Pranzo: dalle 12:30 alle 14:30
Cena: dalle 19:30 alle 22:30

L'ultimo ordine viene accettato 30 minuti prima dell'orario di chiusura.
È consigliata la prenotazione, soprattutto durante il fine settimana e in alta stagione.

Per prenotazioni o informazioni, può contattare il ristorante all'interno 122 o via email a ristorante@villapetriolo.com.
        `.trim();
    }

    // Fornisce informazioni sui prezzi
    getPriceInformation() {
        return `
INFORMAZIONI SUI PREZZI DEL RISTORANTE VILLA PETRIOLO

Il nostro ristorante offre diverse opzioni di prezzo:

- Menu à la carte: Il prezzo medio è di circa €65-85 a persona (bevande escluse)
- Menu degustazione: €95 a persona (5 portate, bevande escluse)
- Menu degustazione con abbinamento vini: €135 a persona

Per gli ospiti della villa è disponibile un menu speciale a €75 a persona, che include una selezione di antipasti, primo, secondo e dolce.

I bambini sotto i 12 anni hanno un menu dedicato a €30.

Per prenotazioni o informazioni, può contattare il ristorante all'interno 122 o via email a ristorante@villapetriolo.com.
        `.trim();
    }

    // Fornisce informazioni generali sul ristorante
    getGeneralInformation() {
        return `
Il Ristorante Villa Petriolo offre un'esperienza culinaria raffinata in un'atmosfera elegante e accogliente. Il nostro chef utilizza ingredienti locali di alta qualità per creare piatti che celebrano la tradizione toscana con un tocco contemporaneo.

Il ristorante è aperto tutti i giorni per pranzo (12:30-14:30) e cena (19:30-22:30).

Durante la bella stagione, è possibile cenare nella nostra terrazza panoramica con vista sui vigneti e uliveti della tenuta.

Per prenotazioni o informazioni, può contattare il ristorante all'interno 122 o via email a ristorante@villapetriolo.com.
        `.trim();
    }
}

module.exports = new RestaurantIntegration();