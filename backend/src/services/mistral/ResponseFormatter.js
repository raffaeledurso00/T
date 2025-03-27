// src/services/mistral/ResponseFormatter.js
const FormattingUtils = require('./FormattingUtils');
const MessageDetectionUtils = require('./MessageDetectionUtils');

class ResponseFormatter {
    constructor() {
        this.messageDetection = new MessageDetectionUtils();
        this.formattingUtils = new FormattingUtils();
    }

    // Post-process per evitare risposte troppo lunghe ai saluti
    shortenGreetingResponse(response, message) {
        if (this.messageDetection.isSimpleGreeting(message)) {
            // Trova la prima frase completa (fino al punto)
            const firstSentence = response.split('.')[0] + '.';
            
            // Se la prima frase è abbastanza breve, usala
            if (firstSentence.length <= 150) {
                return firstSentence;
            }
            
            // Altrimenti tronca a una lunghezza ragionevole
            const shortenedResponse = response.substring(0, 100);
            // Assicurati che termini con una parola completa
            const lastSpaceIndex = shortenedResponse.lastIndexOf(' ');
            return shortenedResponse.substring(0, lastSpaceIndex) + '...';
        }
        
        return response;
    }

    // Funzione per garantire che il menu includa i prezzi
    ensureMenuHasPrices(response) {
        // Se la risposta non è relativa a un menu, restituisci l'originale
        if (!response.includes('ANTIPASTI:') && 
            !response.includes('PRIMI:') && 
            !response.includes('SECONDI:') && 
            !response.includes('DOLCI:')) {
            return response;
        }
        
        // Verifica se ci sono già prezzi nella risposta (simboli € o euro)
        if (response.includes('€') || 
            response.match(/\d+\s*euro/i) ||
            response.match(/euro\s*\d+/i)) {
            return response;
        }
        
        // Nessun prezzo trovato, aggiungi prezzi fittizi
        const lines = response.split('\n');
        const modifiedLines = lines.map(line => {
            // Salta righe di intestazione e vuote
            if (line.includes('ANTIPASTI:') || 
                line.includes('PRIMI:') || 
                line.includes('SECONDI:') || 
                line.includes('DOLCI:') ||
                line.trim() === '') {
                return line;
            }
            
            // Per le righe di piatti, aggiungi un prezzo se non c'è già
            if (!line.includes('€') && !line.match(/\d+\s*euro/i)) {
                // Genera un prezzo plausibile in base al tipo di piatto
                let basePrice = 0;
                if (lines.indexOf(line) < lines.indexOf('PRIMI:') && lines.indexOf('PRIMI:') > -1) {
                    // Antipasti
                    basePrice = 12 + Math.floor(Math.random() * 6);
                } else if (lines.indexOf(line) < lines.indexOf('SECONDI:') && lines.indexOf('SECONDI:') > -1) {
                    // Primi
                    basePrice = 16 + Math.floor(Math.random() * 10);
                } else if (lines.indexOf(line) < lines.indexOf('DOLCI:') && lines.indexOf('DOLCI:') > -1) {
                    // Secondi
                    basePrice = 22 + Math.floor(Math.random() * 12);
                } else {
                    // Dolci o altro
                    basePrice = 9 + Math.floor(Math.random() * 5);
                }
                
                // Aggiungi il prezzo alla fine della riga
                return `${line} - €${basePrice}`;
            }
            
            return line;
        });
        
        return modifiedLines.join('\n');
    }

    // Funzione per correggere errori comuni nelle risposte
    fixCommonErrors(response) {
        let fixedResponse = response;
        
        // 1. Problema: Parentesi aperte senza chiusura
        fixedResponse = fixedResponse.replace(/\(\s*(\n|$)/g, ' \n');
        
        // 2. Problema: Prezzo dopo una parentesi aperta senza chiusura
        fixedResponse = fixedResponse.replace(/\(\s*(-\s*€\d+|\s*€\d+)/g, ' $1');
        
        // 3. Problema: Frasi di assistenza trattate come prodotti nel menu
        const assistancePattern = /((Se|Per) (hai bisogno|avete bisogno|vuoi|volete|desideri|desiderate) (di )?(assistenza|aiuto|informazioni)|(non esitare|chiedi pure|non esitate|chiedete pure) a chiedere|posso aiutarti|possiamo aiutarti|siamo a disposizione)\b.*?\.?/gi;
        let assistancePhrases = [];
        const matches = fixedResponse.match(assistancePattern);
        if (matches) {
            assistancePhrases = matches;
            matches.forEach(phrase => {
                fixedResponse = fixedResponse.replace(phrase, '');
            });
        }
        
        // 4. Problema: Prezzi solitari su righe separate
        fixedResponse = fixedResponse.replace(/^\s*€\d+\s*$/gm, '');
        
        // 5. Problema: Testo ridondante nei dettagli
        const redundantPatterns = [
            /complimentari:\s*complimentari/gi,
            /gratuito:\s*gratuito/gi,
            /incluso:\s*incluso/gi,
            /([\w']+):\s*\1/gi
        ];
        redundantPatterns.forEach(pattern => {
            fixedResponse = fixedResponse.replace(pattern, '$1');
        });
        
        // Aggiungi le frasi di assistenza alla fine
        if (assistancePhrases.length > 0) {
            if (!fixedResponse.endsWith('\n\n')) {
                fixedResponse = fixedResponse.trim() + '\n\n';
            }
            assistancePhrases.forEach(phrase => {
                fixedResponse += phrase.trim() + '\n';
            });
        }
        
        // 6. Problema: Righe vuote con prezzi in €
        fixedResponse = fixedResponse.replace(/^\s*€\d+\s*$/gm, '');
        
        // 7. Elimina ripetizioni di "complimentari" vicine
        fixedResponse = fixedResponse.replace(/complimentari,?\s+complimentari/gi, 'complimentari');
        
        return fixedResponse.trim();
    }

    // Funzione per garantire che la risposta segua il formato corretto
    // Questa funzione viene usata come fallback se il modello non ha seguito le istruzioni
    enhanceResponseFormatting(response, userMessage) {
        let processedResponse = this.fixCommonErrors(response);
        
        if (this.messageDetection.isSimpleGreeting(userMessage)) {
            return this.shortenGreetingResponse(processedResponse, userMessage);
        }
        
        if (!this.messageDetection.requiresFormattedResponse(userMessage)) {
            return processedResponse;
        }
        
        const hasFormatting = processedResponse.includes('ANTIPASTI:') || 
            processedResponse.includes('PRIMI:') || 
            processedResponse.includes('SECONDI:') || 
            processedResponse.includes('DOLCI:') ||
            processedResponse.includes('INTERNE:') || 
            processedResponse.includes('ESTERNE:') || 
            processedResponse.includes('ESCURSIONI:') ||
            processedResponse.includes('SPECIALI:') || 
            processedResponse.includes('SETTIMANALI:') || 
            processedResponse.includes('STAGIONALI:');
        
        const lowerMessage = userMessage.toLowerCase();
        if (this.messageDetection.isAboutMenu(lowerMessage) && hasFormatting) {
            return this.ensureMenuHasPrices(processedResponse);
        }
        
        if (hasFormatting) {
            return processedResponse;
        }

        // Determina il tipo di contenuto in base alla richiesta dell'utente
        
        // Per i menu o ristorante
        if (this.messageDetection.isAboutMenu(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca vari piatti
            if (this.messageDetection.containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono antipasti, primi, secondi o dolci
                const hasAntipasti = this.messageDetection.detectCourseType(processedResponse, ['antipast', 'starter', 'appetizer']);
                const hasPrimi = this.messageDetection.detectCourseType(processedResponse, ['prim', 'pasta', 'risott', 'zupp']);
                const hasSecondi = this.messageDetection.detectCourseType(processedResponse, ['second', 'carne', 'pesce', 'main course']);
                const hasDolci = this.messageDetection.detectCourseType(processedResponse, ['dolc', 'dessert', 'pasticceria']);
                
                // Formatta la risposta come un menu
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato le portate, strutturiamo il menu
                if (hasAntipasti || hasPrimi || hasSecondi || hasDolci) {
                    formattedResponse = this.formattingUtils.formatMenuResponse(processedResponse, hasAntipasti, hasPrimi, hasSecondi, hasDolci);
                }
                
                // Assicurati che il menu abbia i prezzi
                return this.ensureMenuHasPrices(formattedResponse);
            }
        }
        
        // Per le attività
        else if (this.messageDetection.isAboutActivities(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca varie attività
            if (this.messageDetection.containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono attività interne o esterne
                const hasInterne = this.messageDetection.detectActivityType(processedResponse, ['intern', 'nella villa', 'all\'interno']);
                const hasEsterne = this.messageDetection.detectActivityType(processedResponse, ['estern', 'fuori', 'nei dintorni']);
                const hasEscursioni = this.messageDetection.detectActivityType(processedResponse, ['escursion', 'tour', 'visita guidata']);
                
                // Formatta la risposta come una lista di attività
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato tipi di attività, strutturiamo la risposta
                if (hasInterne || hasEsterne || hasEscursioni) {
                    formattedResponse = this.formattingUtils.formatActivityResponse(processedResponse, hasInterne, hasEsterne, hasEscursioni);
                }
                
                return formattedResponse;
            }
        }
        
        // Per gli eventi
        else if (this.messageDetection.isAboutEvents(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca vari eventi
            if (this.messageDetection.containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono eventi speciali, settimanali o stagionali
                const hasSpeciali = this.messageDetection.detectEventType(processedResponse, ['special', 'unic', 'esclusiv']);
                const hasSettimanali = this.messageDetection.detectEventType(processedResponse, ['settiman', 'ogni settimana', 'ricorrente']);
                const hasStagionali = this.messageDetection.detectEventType(processedResponse, ['stagional', 'estiv', 'invernal', 'autunnal', 'primaver']);
                
                // Formatta la risposta come una lista di eventi
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato tipi di eventi, strutturiamo la risposta
                if (hasSpeciali || hasSettimanali || hasStagionali) {
                    formattedResponse = this.formattingUtils.formatEventResponse(processedResponse, hasSpeciali, hasSettimanali, hasStagionali);
                }
                
                return formattedResponse;
            }
        }
        
        // Nessuna formattazione speciale necessaria, restituisci la risposta originale
        return processedResponse;
    }
}

// Export la classe (assicurandoci che sia esportata correttamente come una classe costruibile)
module.exports = ResponseFormatter;