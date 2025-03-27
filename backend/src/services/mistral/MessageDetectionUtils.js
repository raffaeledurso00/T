// src/services/mistral/MessageDetectionUtils.js

class MessageDetectionUtils {
    // Verifica se il messaggio dell'utente è un saluto semplice
    isSimpleGreeting(message) {
        const simpleGreetings = ['ciao', 'buongiorno', 'buonasera', 'salve', 'hey', 'hi', 'hello', 'hola'];
        const normalizedMessage = message.toLowerCase().trim();
        
        // Controlla se il messaggio è un saluto semplice o un saluto con 1-2 parole aggiuntive
        return simpleGreetings.some(greeting => 
            normalizedMessage === greeting || 
            normalizedMessage.startsWith(greeting + ' ') || 
            normalizedMessage.endsWith(' ' + greeting)
        ) && normalizedMessage.split(/\s+/).length <= 3;
    }

    // Verifica se il messaggio dell'utente richiede una risposta formattata
    requiresFormattedResponse(message) {
        // Se è un saluto semplice, non richiedere formattazione
        if (this.isSimpleGreeting(message)) {
            return false;
        }
        
        const lowerMessage = message.toLowerCase().trim();
        
        // Messaggi brevi che non contengono richieste specifiche non richiedono formattazione
        if (lowerMessage.length < 15 && !this.containsSpecificQuery(lowerMessage)) {
            return false;
        }
        
        // Verifica se il messaggio contiene richieste specifiche
        return this.isAboutMenu(lowerMessage) || 
               this.isAboutActivities(lowerMessage) || 
               this.isAboutEvents(lowerMessage);
    }
    
    // Verifica se il messaggio contiene una richiesta specifica (non solo un saluto)
    containsSpecificQuery(message) {
        const queryWords = ['cosa', 'quali', 'come', 'dove', 'quando', 'perché', 'chi', 'vorrei', 'posso', 'mi', 'informazioni'];
        return queryWords.some(word => message.includes(word));
    }
    
    // Verifica se il messaggio è relativo al menu/ristorante
    isAboutMenu(message) {
        const menuKeywords = ['menu', 'ristorante', 'mangiare', 'cena', 'pranzo', 'colazione', 'piatti', 'cucina'];
        return menuKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad attività
    isAboutActivities(message) {
        const activityKeywords = ['attività', 'fare', 'escursion', 'visita', 'tour', 'passeggiata'];
        return activityKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad eventi
    isAboutEvents(message) {
        const eventKeywords = ['eventi', 'spettacol', 'concerto', 'programma', 'festival', 'manifestazioni'];
        return eventKeywords.some(keyword => message.includes(keyword));
    }

    // Metodo per verificare se la risposta contiene più elementi (lista)
    containsMultipleItems(text) {
        // Verifichiamo la presenza di elenchi puntati o numerati
        const bulletPoints = (text.match(/[-•*]/g) || []).length >= 2;
        const numberedList = (text.match(/\d+\.\s+/g) || []).length >= 2;
        
        // Verifichiamo la presenza di frasi brevi separate da punti
        const shortSentences = text.split('.').filter(s => s.trim().length > 0 && s.trim().length < 100).length > 3;
        
        // Verifichiamo la presenza di virgole che potrebbero separare elementi di una lista
        const commaList = text.split(',').length > 4;
        
        return bulletPoints || numberedList || shortSentences || commaList;
    }

    // Metodi per rilevare tipi di portate, attività ed eventi
    detectCourseType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    detectActivityType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    detectEventType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    // Verifica se una frase è correlata a determinate parole chiave
    isSentenceRelatedTo(sentence, keywords) {
        const lowerSentence = sentence.toLowerCase();
        return keywords.some(keyword => lowerSentence.includes(keyword));
    }
}

// Esporta la classe correttamente
module.exports = MessageDetectionUtils;