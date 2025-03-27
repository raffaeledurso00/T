// frontend/js/utils/context.js
// Gestione del contesto della conversazione
// Nota: Questo file contiene il codice originale di context-utils.js
// È stato rinominato per mantenere la coerenza con la nuova struttura

class ConversationContext {
    constructor() {
        this.currentTopic = null;
        this.topicKeywords = {
            menu: ['menu', 'ristorante', 'cena', 'pranzo', 'colazione', 'piatti', 'mangiare', 'cibo'],
            attivita: ['attività', 'fare', 'tour', 'passeggiata', 'escursione', 'visita'],
            servizi: ['servizi', 'camera', 'wifi', 'parcheggio', 'reception', 'pulizia'],
            eventi: ['eventi', 'concerto', 'spettacolo', 'degustazione', 'programma']
        };
        this.shortQuestions = [
            'altro?', 'e poi?', 'cosa altro?', 'continua', 'ad esempio?', 'come?', 
            'e?', 'tipo?', 'ad esempio', 'per esempio', 'quali?', 'e dopo?'
        ];
        
        // Aggiungiamo un meccanismo per ricordare gli interessi dell'utente
        this.userInterests = new Set();
        this.userPreferences = {};
    }

    /**
     * Analizza un messaggio e aggiorna il contesto della conversazione
     * @param {string} message - Il messaggio dell'utente
     * @param {Array} conversation - Lo storico della conversazione
     * @returns {Object} Informazioni sul contesto
     */
    analyzeMessage(message, conversation) {
        const lowerMessage = message.toLowerCase().trim();
        
        // Verifica se è una domanda breve/di approfondimento
        const isShortQuestion = this.isFollowUpQuestion(lowerMessage);
        
        // Se non è una domanda breve, aggiorna il topic
        if (!isShortQuestion) {
            this.updateTopic(lowerMessage);
            
            // Estrai interessi e preferenze
            this.extractUserPreferences(lowerMessage);
        }
        
        return {
            topic: this.currentTopic,
            isFollowUp: isShortQuestion,
            needsMoreContext: isShortQuestion && !this.currentTopic,
            userInterests: Array.from(this.userInterests),
            userPreferences: this.userPreferences
        };
    }
    
    /**
     * Estrae e memorizza le preferenze dell'utente
     * @param {string} message - Il messaggio dell'utente
     */
    extractUserPreferences(message) {
        // Estrai interessi dalle preferenze espresse
        if (message.match(/mi piace|adoro|interessato a|preferisco/i)) {
            // Cerca sostantivi dopo espressioni di preferenza
            const matches = message.match(/(?:mi piace|adoro|interessato a|preferisco)\s+(?:il|la|le|lo|i|gli|l')?([a-zàèìòù\s]+)/i);
            if (matches && matches[1]) {
                const interest = matches[1].trim().toLowerCase();
                this.userInterests.add(interest);
            }
        }
        
        // Estrai preferenze alimentari
        if (message.match(/vegetarian|vegan|allergic|intolerant|celiac|vegano|vegetariano|allergia|intolleranza|celiaco/i)) {
            this.userPreferences.dietary = message;
        }
        
        // Estrai il numero di persone
        const personMatch = message.match(/per (\d+) person[e|a]/i);
        if (personMatch) {
            this.userPreferences.groupSize = personMatch[1];
        }
    }
    
    /**
     * Verifica se il messaggio è una domanda di approfondimento
     */
    isFollowUpQuestion(message) {
        // Verifica nelle domande brevi predefinite
        if (this.shortQuestions.some(q => message === q || message.startsWith(q))) {
            return true;
        }
        
        // Verifica se è una domanda molto breve
        if (message.length < 10 && message.includes('?')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Aggiorna il topic corrente in base al messaggio
     */
    updateTopic(message) {
        // Controlla quale insieme di parole chiave ha più corrispondenze
        let bestMatch = { topic: null, count: 0 };
        
        for (const [topic, keywords] of Object.entries(this.topicKeywords)) {
            const matchCount = keywords.filter(keyword => message.includes(keyword)).length;
            
            if (matchCount > bestMatch.count) {
                bestMatch = { topic, count: matchCount };
            }
        }
        
        // Aggiorna il topic se abbiamo trovato almeno una corrispondenza
        if (bestMatch.count > 0) {
            this.currentTopic = bestMatch.topic;
        }
        
        return this.currentTopic;
    }
    
    /**
     * Suggerisce un'elaborazione del messaggio in base al contesto
     */
    enhanceMessage(originalMessage, conversation) {
        const context = this.analyzeMessage(originalMessage, conversation);
        
        // Se è una domanda di approfondimento e abbiamo un contesto, aggiungiamo informazioni
        if (context.isFollowUp && this.currentTopic) {
            let enhancedMessage = originalMessage;
            
            // Aggiungi contesto basato sul topic
            switch (this.currentTopic) {
                case 'menu':
                    enhancedMessage = `${originalMessage} riguardo al menu del ristorante`;
                    break;
                case 'attivita':
                    enhancedMessage = `${originalMessage} riguardo alle attività disponibili`;
                    break;
                case 'servizi':
                    enhancedMessage = `${originalMessage} riguardo ai servizi dell'hotel`;
                    break;
                case 'eventi':
                    enhancedMessage = `${originalMessage} riguardo agli eventi in programma`;
                    break;
            }
            
            // Aggiungi eventuali preferenze note dell'utente
            if (this.userPreferences.dietary) {
                enhancedMessage += ` (Nota: l'ospite ha menzionato preferenze alimentari: ${this.userPreferences.dietary})`;
            }
            
            if (this.userPreferences.groupSize) {
                enhancedMessage += ` (Nota: l'ospite ha menzionato un gruppo di ${this.userPreferences.groupSize} persone)`;
            }
            
            return enhancedMessage;
        }
        
        return originalMessage;
    }
    
    /**
     * Resetta il contesto della conversazione
     */
    reset() {
        this.currentTopic = null;
        this.userInterests = new Set();
        this.userPreferences = {};
    }
}

// Crea l'istanza globale
window.conversationContext = new ConversationContext();