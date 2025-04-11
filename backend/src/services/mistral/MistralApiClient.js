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
            if (this.apiKey) {
                console.log('MISTRAL_API_KEY first 4 chars:', this.apiKey.substring(0, 4));
            }

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
        if (DEBUG) console.log('Calling Mistral API with messages');
        
        try {
            // If we're not in fallback mode and have a client, use it
            if (!this.isFallbackMode && this.client) {
                if (DEBUG) console.log('Using actual Mistral API');
                
                try {
                    // Estrai l'ultimo messaggio dell'utente
                    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                    const userMessageText = lastUserMessage ? lastUserMessage.content : '';
                    
                    // Rileva la lingua dell'ultimo messaggio dell'utente
                    const detectedLanguage = this.languageDetector.detect(userMessageText);
                    console.log(`[MistralApiClient] Lingua rilevata per la richiesta: ${detectedLanguage}`);
                    
                    // Istruzioni in lingua - molto semplici
                    const systemInstruction = {
                        role: 'system', 
                        content: `IMPORTANT: You must answer in ${detectedLanguage} language ONLY. You are the Villa Petriolo digital concierge. 
                        Be helpful, direct and to the point. Always provide accurate information about the villa and surrounding area.
                        Restaurant information: Open daily, Lunch 12:30-14:30, Dinner 19:30-22:30, Reservations at ext. 122 or ristorante@villapetriolo.com`
                    };
                    
                    // Aggiungi l'istruzione senza complicare
                    let messagesForAPI = [systemInstruction, ...messages];
                    
                    // Configurazione API - semplice e diretta
                    const options = {
                        model: 'mistral-medium',     // Aggiornato al modello supportato
                        messages: messagesForAPI,
                        temperature: 0.7,           // Temperatura standard per creatività
                        maxTokens: 2000             // Token aumentati per risposte complete
                    };
                    
                    // Call the API with proper error handling
                    const response = await this.client.chat(options);
                    
                    if (DEBUG) console.log('Got response from Mistral API');
                    
                    if (response && response.choices && response.choices.length > 0) {
                        // Estrai il messaggio originale senza modifiche
                        const originalMessage = response.choices[0].message;
                        
                        // No post-processing - risposte naturali
                        let processedContent = originalMessage.content;
                        
                        // Fix di base solo per errori comuni
                        processedContent = responseFormatter.fixCommonErrors(processedContent);
                        
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
            // Messaggio di errore semplice
            return {
                content: "Si è verificato un errore. Riprova tra qualche istante.",
                role: 'assistant'
            };
        }
    }
}

module.exports = MistralApiClient;