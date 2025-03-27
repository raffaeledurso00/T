// backend/src/services/mistralService.js
const { redisClient, isRedisFallbackMode } = require('../config/database');

// Set DEBUG to true for detailed logging
const DEBUG = false;

// Cache for the Mistral module to avoid multiple imports
let mistralModule;

class MistralService {
    constructor() {
        // Initialize properties
        this.client = null;
        this.isFallbackMode = false;
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.conversationHistory = new Map();
        
        // Initialize client asynchronously to avoid startup errors
        this._initializeMistralClient().catch(err => {
            console.error('Failed to initialize Mistral client, using fallback mode:', err);
            this.isFallbackMode = true;
        });
    }

    async _initializeMistralClient() {
        try {
            console.log('Initializing Mistral client...');
            console.log('MISTRAL_API_KEY present:', !!this.apiKey);
            console.log('MISTRAL_API_KEY first 4 chars:', this.apiKey ? this.apiKey.substring(0, 4) : 'none');

            if (!this.apiKey) {
                console.warn('MISTRAL_API_KEY not set, will use fallback mode');
                this.isFallbackMode = true;
                return;
            }
            
            // Only import if we haven't already
            if (!mistralModule) {
                console.log('Importing MistralAI module...');
                
                try {
                    // Import as ES module
                    const module = await import('@mistralai/mistralai');
                    // Store the default export (which is the MistralClient class)
                    mistralModule = { MistralClient: module.default };
                    console.log('Module imported successfully as ES module');
                } catch (importError) {
                    console.error('Error importing MistralAI as ES module:', importError);
                    // If ES module import fails, we'll go to fallback mode
                    this.isFallbackMode = true;
                    return;
                }
            }
            
            // Access the MistralClient constructor
            const MistralClientConstructor = mistralModule.MistralClient;
            
            if (!MistralClientConstructor) {
                console.error('MistralClient not found in imported module!', mistralModule);
                this.isFallbackMode = true;
                return;
            }
            
            console.log('Creating MistralClient with constructor...');
            this.client = new MistralClientConstructor(this.apiKey);
            console.log('Mistral client initialized successfully');
            this.isFallbackMode = false;
        } catch (error) {
            console.error('Error initializing Mistral client:', error);
            this.isFallbackMode = true;
        }
    }

    async initializeConversation(sessionId) {
        try {
            if (DEBUG) console.log(`Initializing conversation for session ${sessionId}`);
            
            // Istruisci il modello con prompt più specifico
            const systemMessage = {
                role: 'system',
                content: 'Sei l\'assistente virtuale di Villa Petriolo, un\'esclusiva villa di lusso in Toscana. ' +
                         'Aiuta gli ospiti con informazioni sulla villa, prenotazioni, e servizi disponibili. ' +
                         
                         // Linee guida specifiche per i saluti
                         'Per saluti come "ciao", "buongiorno", "salve", ecc., rispondi con un messaggio breve e amichevole di massimo 1-2 frasi. ' +
                         'Evita risposte lunghe e formali a saluti semplici. ' +
                         
                         // Linee guida per il menu con prezzi
                         'Quando fornisci informazioni sul menu o sul ristorante, includi SEMPRE i prezzi per ogni piatto (es: €15, €22, ecc). ' +
                         
                         // Linee guida per formattazione specifica
                         'IMPORTANTE: SOLO quando l\'utente chiede informazioni specifiche usa la formattazione speciale: ' +
                         '- Per menu/ristorante: usa le sezioni "ANTIPASTI:", "PRIMI:", "SECONDI:", "DOLCI:" includendo sempre il prezzo per ogni piatto. ' +
                         '- Per attività: usa le sezioni "INTERNE:", "ESTERNE:", "ESCURSIONI:" includendo sempre costi e durata. ' +
                         '- Per eventi: usa le sezioni "SPECIALI:", "SETTIMANALI:", "STAGIONALI:" includendo sempre date e costi. ' +
                         
                         // Mantenere risposte in ambito
                         'Per domande generali, rispondi in modo naturale e conciso senza usare formattazioni speciali.'
            };
            
            // Initialize conversation history
            const messages = [systemMessage];
            
            // Store in memory or Redis based on configuration
            if (isRedisFallbackMode) {
                this.conversationHistory.set(sessionId, messages);
            } else {
                try {
                    await redisClient.set(
                        `chat:${sessionId}`,
                        JSON.stringify(messages),
                        'EX',
                        86400 // 24 hours
                    );
                } catch (redisError) {
                    console.error('Redis error during initialization, using in-memory storage:', redisError);
                    this.conversationHistory.set(sessionId, messages);
                }
            }
            
            if (DEBUG) console.log(`Conversation initialized for session ${sessionId}`);
            return true;
        } catch (error) {
            console.error('Error initializing conversation:', error);
            throw error;
        }
    }

    async getConversationHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Getting conversation history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                // In-memory storage mode
                if (!this.conversationHistory.has(sessionId)) {
                    if (DEBUG) console.log(`No history found for ${sessionId}, initializing new conversation`);
                    await this.initializeConversation(sessionId);
                }
                return this.conversationHistory.get(sessionId);
            } else {
                try {
                    // Try Redis first
                    const history = await redisClient.get(`chat:${sessionId}`);
                    
                    if (history) {
                        if (DEBUG) console.log(`Found history in Redis for ${sessionId}`);
                        return JSON.parse(history);
                    } else {
                        if (DEBUG) console.log(`No history in Redis for ${sessionId}, initializing`);
                        await this.initializeConversation(sessionId);
                        return await this.getConversationHistory(sessionId);
                    }
                } catch (redisError) {
                    console.error('Redis error, falling back to in-memory:', redisError);
                    if (!this.conversationHistory.has(sessionId)) {
                        await this.initializeConversation(sessionId);
                    }
                    return this.conversationHistory.get(sessionId);
                }
            }
        } catch (error) {
            console.error(`Error retrieving conversation history for ${sessionId}:`, error);
            // Create a new conversation in case of error
            await this.initializeConversation(sessionId);
            return this.conversationHistory.get(sessionId) || [];
        }
    }

    async updateConversationHistory(sessionId, messages) {
        try {
            if (DEBUG) console.log(`Updating conversation history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                this.conversationHistory.set(sessionId, messages);
            } else {
                try {
                    await redisClient.set(
                        `chat:${sessionId}`,
                        JSON.stringify(messages),
                        'EX',
                        86400 // 24 hours
                    );
                } catch (redisError) {
                    console.error('Redis error when updating history, using in-memory:', redisError);
                    this.conversationHistory.set(sessionId, messages);
                }
            }
        } catch (error) {
            console.error(`Error updating conversation history for ${sessionId}:`, error);
            throw error;
        }
    }

    // Verifica se il messaggio dell'utente è un saluto semplice
    _isSimpleGreeting(message) {
        const simpleGreetings = ['ciao', 'buongiorno', 'buonasera', 'salve', 'hey', 'hi', 'hello', 'hola'];
        const normalizedMessage = message.toLowerCase().trim();
        
        // Controlla se il messaggio è un saluto semplice o un saluto con 1-2 parole aggiuntive
        return simpleGreetings.some(greeting => 
            normalizedMessage === greeting || 
            normalizedMessage.startsWith(greeting + ' ') || 
            normalizedMessage.endsWith(' ' + greeting)
        ) && normalizedMessage.split(/\s+/).length <= 3;
    }

    // Post-process per evitare risposte troppo lunghe ai saluti
    _shortenGreetingResponse(response, message) {
        if (this._isSimpleGreeting(message)) {
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

    // Verifica se il messaggio dell'utente richiede una risposta formattata
    _requiresFormattedResponse(message) {
        // Se è un saluto semplice, non richiedere formattazione
        if (this._isSimpleGreeting(message)) {
            return false;
        }
        
        const lowerMessage = message.toLowerCase().trim();
        
        // Messaggi brevi che non contengono richieste specifiche non richiedono formattazione
        if (lowerMessage.length < 15 && !this._containsSpecificQuery(lowerMessage)) {
            return false;
        }
        
        // Verifica se il messaggio contiene richieste specifiche
        return this._isAboutMenu(lowerMessage) || 
               this._isAboutActivities(lowerMessage) || 
               this._isAboutEvents(lowerMessage);
    }
    
    // Verifica se il messaggio contiene una richiesta specifica (non solo un saluto)
    _containsSpecificQuery(message) {
        const queryWords = ['cosa', 'quali', 'come', 'dove', 'quando', 'perché', 'chi', 'vorrei', 'posso', 'mi', 'informazioni'];
        return queryWords.some(word => message.includes(word));
    }
    
    // Verifica se il messaggio è relativo al menu/ristorante
    _isAboutMenu(message) {
        const menuKeywords = ['menu', 'ristorante', 'mangiare', 'cena', 'pranzo', 'colazione', 'piatti', 'cucina'];
        return menuKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad attività
    _isAboutActivities(message) {
        const activityKeywords = ['attività', 'fare', 'escursion', 'visita', 'tour', 'passeggiata'];
        return activityKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad eventi
    _isAboutEvents(message) {
        const eventKeywords = ['eventi', 'spettacol', 'concerto', 'programma', 'festival', 'manifestazioni'];
        return eventKeywords.some(keyword => message.includes(keyword));
    }

    // Funzione per garantire che il menu includa i prezzi
    _ensureMenuHasPrices(response) {
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

    // Funzione per garantire che la risposta segua il formato corretto
    // Questa funzione viene usata come fallback se il modello non ha seguito le istruzioni
    enhanceResponseFormatting(response, userMessage) {
        let processedResponse = this._fixCommonErrors(response);
        
        if (this._isSimpleGreeting(userMessage)) {
            return this._shortenGreetingResponse(processedResponse, userMessage);
        }
        
        if (!this._requiresFormattedResponse(userMessage)) {
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
        if (this._isAboutMenu(lowerMessage) && hasFormatting) {
            return this._ensureMenuHasPrices(processedResponse);
        }
        
        if (hasFormatting) {
            return processedResponse;
        }

        // Determina il tipo di contenuto in base alla richiesta dell'utente
        
        // Per i menu o ristorante
        if (this._isAboutMenu(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca vari piatti
            if (this._containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono antipasti, primi, secondi o dolci
                const hasAntipasti = this._detectCourseType(processedResponse, ['antipast', 'starter', 'appetizer']);
                const hasPrimi = this._detectCourseType(processedResponse, ['prim', 'pasta', 'risott', 'zupp']);
                const hasSecondi = this._detectCourseType(processedResponse, ['second', 'carne', 'pesce', 'main course']);
                const hasDolci = this._detectCourseType(processedResponse, ['dolc', 'dessert', 'pasticceria']);
                
                // Formatta la risposta come un menu
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato le portate, strutturiamo il menu
                if (hasAntipasti || hasPrimi || hasSecondi || hasDolci) {
                    formattedResponse = this._formatMenuResponse(processedResponse, hasAntipasti, hasPrimi, hasSecondi, hasDolci);
                }
                
                // Assicurati che il menu abbia i prezzi
                return this._ensureMenuHasPrices(formattedResponse);
            }
        }
        
        // Per le attività
        else if (this._isAboutActivities(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca varie attività
            if (this._containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono attività interne o esterne
                const hasInterne = this._detectActivityType(processedResponse, ['intern', 'nella villa', 'all\'interno']);
                const hasEsterne = this._detectActivityType(processedResponse, ['estern', 'fuori', 'nei dintorni']);
                const hasEscursioni = this._detectActivityType(processedResponse, ['escursion', 'tour', 'visita guidata']);
                
                // Formatta la risposta come una lista di attività
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato tipi di attività, strutturiamo la risposta
                if (hasInterne || hasEsterne || hasEscursioni) {
                    formattedResponse = this._formatActivityResponse(processedResponse, hasInterne, hasEsterne, hasEscursioni);
                }
                
                return formattedResponse;
            }
        }
        
        // Per gli eventi
        else if (this._isAboutEvents(lowerMessage)) {
            // Verifica se il contenuto della risposta elenca vari eventi
            if (this._containsMultipleItems(processedResponse)) {
                // Cerca di individuare se ci sono eventi speciali, settimanali o stagionali
                const hasSpeciali = this._detectEventType(processedResponse, ['special', 'unic', 'esclusiv']);
                const hasSettimanali = this._detectEventType(processedResponse, ['settiman', 'ogni settimana', 'ricorrente']);
                const hasStagionali = this._detectEventType(processedResponse, ['stagional', 'estiv', 'invernal', 'autunnal', 'primaver']);
                
                // Formatta la risposta come una lista di eventi
                let formattedResponse = processedResponse;
                
                // Se abbiamo rilevato tipi di eventi, strutturiamo la risposta
                if (hasSpeciali || hasSettimanali || hasStagionali) {
                    formattedResponse = this._formatEventResponse(processedResponse, hasSpeciali, hasSettimanali, hasStagionali);
                }
                
                return formattedResponse;
            }
        }
        
        // Nessuna formattazione speciale necessaria, restituisci la risposta originale
        return processedResponse;
    }

    // Metodo per verificare se la risposta contiene più elementi (lista)
    _containsMultipleItems(text) {
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
    _detectCourseType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    _detectActivityType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    _detectEventType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    // Metodo per formattare la risposta come un menu
    _formatMenuResponse(text, hasAntipasti, hasPrimi, hasSecondi, hasDolci) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let antipasti = [];
        let primi = [];
        let secondi = [];
        let dolci = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasAntipasti && this._isSentenceRelatedTo(s, ['antipast', 'starter', 'appetizer', 'bruschett', 'carpacci'])) {
                antipasti.push(sentenceText);
            } else if (hasPrimi && this._isSentenceRelatedTo(s, ['prim', 'pasta', 'risott', 'zupp', 'gnocchi', 'lasagn'])) {
                primi.push(sentenceText);
            } else if (hasSecondi && this._isSentenceRelatedTo(s, ['second', 'carne', 'pesce', 'main course', 'bistecca', 'filetto'])) {
                secondi.push(sentenceText);
            } else if (hasDolci && this._isSentenceRelatedTo(s, ['dolc', 'dessert', 'pasticceria', 'torta', 'gelato'])) {
                dolci.push(sentenceText);
            } else {
                // Se la frase è breve e contiene un nome di piatto, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasAntipasti && antipasti.length < 2) antipasti.push(sentenceText);
                    else if (hasPrimi && primi.length < 2) primi.push(sentenceText);
                    else if (hasSecondi && secondi.length < 2) secondi.push(sentenceText);
                    else if (hasDolci && dolci.length < 2) dolci.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasAntipasti && antipasti.length > 0) {
            formattedResponse += 'ANTIPASTI:\n' + antipasti.join('\n') + '\n\n';
        }
        
        if (hasPrimi && primi.length > 0) {
            formattedResponse += 'PRIMI:\n' + primi.join('\n') + '\n\n';
        }
        
        if (hasSecondi && secondi.length > 0) {
            formattedResponse += 'SECONDI:\n' + secondi.join('\n') + '\n\n';
        }
        
        if (hasDolci && dolci.length > 0) {
            formattedResponse += 'DOLCI:\n' + dolci.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }

    // Metodo per formattare la risposta come una lista di attività
    _formatActivityResponse(text, hasInterne, hasEsterne, hasEscursioni) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let interne = [];
        let esterne = [];
        let escursioni = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasInterne && this._isSentenceRelatedTo(s, ['intern', 'nella villa', 'all\'interno', 'piscina', 'spa'])) {
                interne.push(sentenceText);
            } else if (hasEsterne && this._isSentenceRelatedTo(s, ['estern', 'fuori', 'nei dintorni', 'giardino', 'terrazza'])) {
                esterne.push(sentenceText);
            } else if (hasEscursioni && this._isSentenceRelatedTo(s, ['escursion', 'tour', 'visita guidata', 'gita'])) {
                escursioni.push(sentenceText);
            } else {
                // Se la frase è breve e sembra un'attività, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasInterne && interne.length < 2) interne.push(sentenceText);
                    else if (hasEsterne && esterne.length < 2) esterne.push(sentenceText);
                    else if (hasEscursioni && escursioni.length < 2) escursioni.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasInterne && interne.length > 0) {
            formattedResponse += 'INTERNE:\n' + interne.join('\n') + '\n\n';
        }
        
        if (hasEsterne && esterne.length > 0) {
            formattedResponse += 'ESTERNE:\n' + esterne.join('\n') + '\n\n';
        }
        
        if (hasEscursioni && escursioni.length > 0) {
            formattedResponse += 'ESCURSIONI:\n' + escursioni.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }

    // Metodo per formattare la risposta come una lista di eventi
    _formatEventResponse(text, hasSpeciali, hasSettimanali, hasStagionali) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let speciali = [];
        let settimanali = [];
        let stagionali = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasSpeciali && this._isSentenceRelatedTo(s, ['special', 'unic', 'esclusiv', 'event'])) {
                speciali.push(sentenceText);
            } else if (hasSettimanali && this._isSentenceRelatedTo(s, ['settiman', 'ogni settimana', 'ricorrente', 'ogni'])) {
                settimanali.push(sentenceText);
            } else if (hasStagionali && this._isSentenceRelatedTo(s, ['stagional', 'estiv', 'invernal', 'autunnal', 'primaver'])) {
                stagionali.push(sentenceText);
            } else {
                // Se la frase è breve e sembra un evento, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasSpeciali && speciali.length < 2) speciali.push(sentenceText);
                    else if (hasSettimanali && settimanali.length < 2) settimanali.push(sentenceText);
                    else if (hasStagionali && stagionali.length < 2) stagionali.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasSpeciali && speciali.length > 0) {
            formattedResponse += 'SPECIALI:\n' + speciali.join('\n') + '\n\n';
        }
        
        if (hasSettimanali && settimanali.length > 0) {
            formattedResponse += 'SETTIMANALI:\n' + settimanali.join('\n') + '\n\n';
        }
        
        if (hasStagionali && stagionali.length > 0) {
            formattedResponse += 'STAGIONALI:\n' + stagionali.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }

    // Verifica se una frase è correlata a determinate parole chiave
    _isSentenceRelatedTo(sentence, keywords) {
        const lowerSentence = sentence.toLowerCase();
        return keywords.some(keyword => lowerSentence.includes(keyword));
    }

    // Funzione per correggere errori comuni nelle risposte
    _fixCommonErrors(response) {
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

    async callMistralAPI(messages) {
        if (DEBUG) console.log('Calling Mistral API with messages:', messages);
        
        try {
            // If we're not in fallback mode and have a client, use it
            if (!this.isFallbackMode && this.client) {
                if (DEBUG) console.log('Using actual Mistral API');
                
                try {
                    // Estrai l'ultimo messaggio dell'utente
                    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                    const userMessageText = lastUserMessage ? lastUserMessage.content : '';
                    
                    // Verifica se il messaggio è un saluto semplice
                    const isGreeting = this._isSimpleGreeting(userMessageText);
                    if (DEBUG) console.log(`Message is a simple greeting: ${isGreeting}`);
                    
                    // Verifica se il messaggio richiede una risposta formattata
                    const needsFormat = this._requiresFormattedResponse(userMessageText);
                    if (DEBUG) console.log(`Message needs formatted response: ${needsFormat}`);
                    
                    // Se il messaggio è semplice (come un "ciao"), aggiungi un messaggio specifico
                    // per evitare risposte formattate non necessarie
                    let messagesForAPI = [...messages];
                    if (isGreeting) {
                        // Aggiungi un messaggio di sistema temporaneo per guidare la risposta
                        messagesForAPI.push({
                            role: 'system',
                            content: 'Il messaggio dell\'utente è un semplice saluto. ' +
                                    'Rispondi in modo breve e conversazionale, con 1-2 frasi al massimo. ' +
                                    'Sii amichevole ma conciso. Non usare formattazioni speciali. ' +
                                    'Non usare le sezioni ANTIPASTI, PRIMI, SECONDI, DOLCI, INTERNE, ESTERNE, ESCURSIONI, ' +
                                    'SPECIALI, SETTIMANALI, STAGIONALI o altre formattazioni.'
                        });
                    } else if (needsFormat && this._isAboutMenu(userMessageText)) {
                        // Per domande sul menu, assicurati che includa i prezzi
                        messagesForAPI.push({
                            role: 'system',
                            content: 'L\'utente chiede informazioni sul menu o sul ristorante. ' +
                                    'Usa un formato strutturato con le sezioni ANTIPASTI:, PRIMI:, SECONDI:, DOLCI:. ' +
                                    'IMPORTANTE: Includi SEMPRE i prezzi per ogni piatto (es. €15, €22, ecc.).'
                        });
                    }
                    
                    // Prepare options for the API call
                    const options = {
                        model: 'mistral-tiny',  // You can change the model as needed
                        messages: messagesForAPI,
                        temperature: 0.7,
                        maxTokens: 1000
                    };
                    
                    // Call the API with proper error handling
                    const response = await this.client.chat(options);
                    
                    if (DEBUG) console.log('Got response from Mistral API:', response);
                    
                    if (response && response.choices && response.choices.length > 0) {
                        // Estrai il messaggio originale
                        const originalMessage = response.choices[0].message;
                        
                        // Post-processing della risposta
                        let processedContent = originalMessage.content;
                        
                        processedContent = this._fixCommonErrors(processedContent);
                        
                        // Se è un saluto, accorcia la risposta
                        if (isGreeting) {
                            processedContent = this._shortenGreetingResponse(processedContent, userMessageText);
                        } 
                        // Se è una richiesta di menu, assicurati che includa i prezzi
                        else if (needsFormat && this._isAboutMenu(userMessageText)) {
                            processedContent = this._ensureMenuHasPrices(processedContent);
                        }
                        // Altrimenti, applica la formattazione standard se necessario
                        else if (needsFormat) {
                            processedContent = this.enhanceResponseFormatting(processedContent, userMessageText);
                        }
                        
                        // Crea un nuovo messaggio con il contenuto processato
                        return {
                            content: processedContent,
                            role: originalMessage.role
                        };
                    }
                    
                    throw new Error('Invalid response format from Mistral API');
                } catch (apiError) {
                    console.error('Error calling Mistral API:', apiError);
                    throw apiError; // Non falliamo silenziosamente, segnaliamo l'errore
                }
            } else {
                // Siamo in fallback mode o non abbiamo un client
                throw new Error('Mistral API not available');
            }
        } catch (error) {
            console.error('Error in callMistralAPI:', error);
            // Restituisci un messaggio di errore chiaro invece di inventare una risposta
            return {
                content: "Mi scusi, si è verificato un errore nella connessione al servizio. Per favore riprovi tra poco.",
                role: 'assistant'
            };
        }
    }

    async processMessage(message, sessionId) {
        try {
            if (DEBUG) console.log(`Processing message for session ${sessionId}: "${message}"`);
            
            // Get conversation history
            const history = await this.getConversationHistory(sessionId);
            
            // Add user message to history
            history.push({
                role: 'user',
                content: message
            });
            
            // Get response from API
            const response = await this.callMistralAPI(history);
            const assistantMessage = response.content;
            
            if (DEBUG) console.log(`Got assistant response: "${assistantMessage}"`);
            
            // Add assistant response to history
            history.push({
                role: 'assistant',
                content: assistantMessage
            });
            
            // Update conversation history
            await this.updateConversationHistory(sessionId, history);
            
            return {
                message: assistantMessage,
                sessionId: sessionId
            };
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Return a fallback response in case of error
            return {
                message: "Mi scusi, si è verificato un errore nella comunicazione. Può riprovare tra qualche istante?",
                sessionId: sessionId,
                error: true
            };
        }
    }

    async clearHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Clearing history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                this.conversationHistory.delete(sessionId);
            } else {
                try {
                    await redisClient.del(`chat:${sessionId}`);
                } catch (redisError) {
                    console.error('Redis error when clearing history:', redisError);
                }
            }
            
            // Reinitialize the conversation
            await this.initializeConversation(sessionId);
            
            return {
                message: "Storia della conversazione cancellata con successo.",
                sessionId: sessionId
            };
        } catch (error) {
            console.error('Error clearing history:', error);
            return {
                message: "Si è verificato un errore durante la cancellazione della conversazione.",
                sessionId: sessionId,
                error: true
            };
        }
    }
}

// Export a singleton instance of MistralService
module.exports = new MistralService();