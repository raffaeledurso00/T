// src/services/mistral/MistralApiClient.js
const LanguageDetector = require('./LanguageDetector');
const MultiLanguageHandler = require('./MultiLanguageHandler');

// Set DEBUG to true for detailed logging
const DEBUG = true;

// Cache for the Mistral module to avoid multiple imports
let mistralModule;

class MistralApiClient {
    constructor() {
        // Initialize properties
        this.client = null;
        this.isFallbackMode = false;
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.languageDetector = new LanguageDetector();
        this.multiLanguageHandler = new MultiLanguageHandler();
        
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

    async callMistralAPI(messages, userMessage, messageDetection, responseFormatter) {
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
                    const isGreeting = messageDetection.isSimpleGreeting(userMessageText);
                    if (DEBUG) console.log(`Message is a simple greeting: ${isGreeting}`);
                    
                    // Verifica se il messaggio richiede una risposta formattata
                    const needsFormat = messageDetection.requiresFormattedResponse(userMessageText);
                    if (DEBUG) console.log(`Message needs formatted response: ${needsFormat}`);
                    
                    // Se il messaggio è semplice (come un "ciao"), aggiungi un messaggio specifico
                    // per evitare risposte formattate non necessarie
                    let messagesForAPI = [...messages];
                    if (isGreeting) {
                        // Aggiungi un messaggio di sistema temporaneo molto chiaro per guidare la risposta
                        messagesForAPI = [
                            {
                                role: 'system',
                                content: 'Sei il concierge digitale di Villa Petriolo. L\'utente ti ha inviato un saluto. ' +
                                        'Rispondi SOLO con una frase di benvenuto molto breve (max 15-20 parole), ' +
                                        'cordiale ma concisa. NON fornire dettagli sui servizi, orari, o attività disponibili ' +
                                        'a meno che non siano esplicitamente richiesti.'
                            },
                            // Mantieni solo l'ultimo messaggio dell'utente per i saluti
                            messages[messages.length - 1]
                        ];
                    } else if (needsFormat && messageDetection.isAboutMenu(userMessageText)) {
                        // Per domande sul menu, assicurati che includa i prezzi
                        messagesForAPI.push({
                            role: 'system',
                            content: 'L\'utente chiede informazioni sul menu o sul ristorante. ' +
                                    'Usa un formato strutturato con le sezioni ANTIPASTI:, PRIMI:, SECONDI:, DOLCI:. ' +
                                    'IMPORTANTE: Includi SEMPRE i prezzi per ogni piatto (es. €15, €22, ecc.).'
                        });
                    }
                    
                    // Rileva la lingua dell'ultimo messaggio dell'utente
                    const detectedLanguage = this.languageDetector.detect(userMessageText);
                    console.log(`[MistralApiClient] Lingua rilevata per la richiesta: ${detectedLanguage}`);
                    
                    // Aggiungi istruzione specifica per rispondere nella lingua rilevata
                    messagesForAPI.push({
                        role: 'system',
                        content: `Rispondi all'utente in lingua ${detectedLanguage}. Respond in the ${detectedLanguage} language. 回复用${detectedLanguage}语言。Отвечай на языке ${detectedLanguage}.`
                    });
                    
                    // Prepare options for the API call
                    // Mappa dei nomi completi delle lingue per istruzioni più chiare a Mistral
                    const languageNames = {
                        it: "italiano",
                        en: "English",
                        fr: "Français",
                        es: "Español",
                        de: "Deutsch",
                        zh: "中文",
                        ru: "Русский",
                        ja: "日本語",
                        ko: "한국어",
                        ar: "العربية",
                        pt: "Português",
                        nl: "Nederlands",
                        hi: "हिन्दी",
                        tr: "Türkçe",
                        pl: "Polski",
                        sv: "Svenska",
                        th: "ไทย"
                    };
                    
                    // Aggiorna l'istruzione con il nome completo della lingua
                    const languageInstruction = `IMPORTANTE: Rispondi all'utente SOLO in lingua ${languageNames[detectedLanguage] || detectedLanguage}. ` + 
                        `IMPORTANT: Respond to the user ONLY in ${languageNames[detectedLanguage] || detectedLanguage} language. ` +
                        `ЗАПРЕЩЕНО отвечать на любом языке, кроме ${languageNames[detectedLanguage] || detectedLanguage}. ` +
                        `必须只使用${languageNames[detectedLanguage] || detectedLanguage}语言回复。`;
                    
                    console.log(`[MistralApiClient] Istruzione lingua inviata a Mistral: "${languageInstruction}"`);
                    messagesForAPI[messagesForAPI.length - 1].content = languageInstruction;
                    
                    // Istruzioni extra potenziate per specifiche lingue
                    if (detectedLanguage === 'ru') {
                        // Istruzioni extra esplicite per il russo
                        const russianInstruction = `
                        ОЧЕНЬ ВАЖНО: Вы ДОЛЖНЫ отвечать ТОЛЬКО на русском языке.
                        ВАЖНО: Все ответы должны быть ТОЛЬКО на русском языке, это абсолютное требование.
                        ЗАПРЕЩЕНО: Отвечать на любом языке кроме русского.
                        СТРОГОЕ ТРЕБОВАНИЕ: Использовать ТОЛЬКО русский язык в ответах.
                        `;
                        messagesForAPI.push({
                            role: 'system',
                            content: russianInstruction
                        });
                        console.log(`[MistralApiClient] Aggiunta istruzione rafforzata per russo`);
                    }
                    
                    // Configurazione ottimizzata per specifiche lingue
                    let temperature = 0.7;
                    let maxTokens = 1000;
                    
                    // Per il russo abbassiamo la temperatura per risposte più deterministiche
                    if (detectedLanguage === 'ru') {
                        temperature = 0.2; // Temperatura molto più bassa per risposte più prevedibili
                        console.log(`[MistralApiClient] Temperatura ottimizzata per russo: ${temperature}`);
                    }
                    
                    const options = {
                        model: 'mistral-tiny',  // You can change the model as needed
                        messages: messagesForAPI,
                        temperature: temperature,
                        maxTokens: maxTokens
                    };
                    
                    // Call the API with proper error handling
                    const response = await this.client.chat(options);
                    
                    if (DEBUG) console.log('Got response from Mistral API:', response);
                    
                    if (response && response.choices && response.choices.length > 0) {
                        // Estrai il messaggio originale
                        const originalMessage = response.choices[0].message;
                        
                        // Post-processing della risposta
                        let processedContent = originalMessage.content;
                        
                        processedContent = responseFormatter.fixCommonErrors(processedContent);
                        
                        // Se è un saluto, accorcia la risposta
                        if (isGreeting) {
                            // Se è un saluto semplice, gestisci con il formatter
                            if (messageDetection.isSimpleGreeting(userMessageText)) {
                                processedContent = responseFormatter.shortenGreetingResponse(processedContent, userMessageText);
                            } else {
                                processedContent = responseFormatter.shortenGreetingResponse(processedContent, userMessageText);
                            }
                        } 
                        // Se è una richiesta di menu, assicurati che includa i prezzi
                        else if (needsFormat && messageDetection.isAboutMenu(userMessageText)) {
                            processedContent = responseFormatter.ensureMenuHasPrices(processedContent);
                        }
                        // Altrimenti, applica la formattazione standard se necessario
                        else if (needsFormat) {
                            processedContent = responseFormatter.enhanceResponseFormatting(processedContent, userMessageText);
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
            // Rileva la lingua dell'utente per il messaggio di errore
            const detectedLanguage = this.languageDetector.detect(userMessage || '');
            // Restituisci un messaggio di errore nella lingua rilevata
            return {
                content: this.multiLanguageHandler.getErrorMessage(detectedLanguage),
                role: 'assistant'
            };
        }
    }
}

module.exports = MistralApiClient;