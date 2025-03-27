// src/services/mistral/MistralApiClient.js

// Set DEBUG to true for detailed logging
const DEBUG = false;

// Cache for the Mistral module to avoid multiple imports
let mistralModule;

class MistralApiClient {
    constructor() {
        // Initialize properties
        this.client = null;
        this.isFallbackMode = false;
        this.apiKey = process.env.MISTRAL_API_KEY;
        
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
                        // Aggiungi un messaggio di sistema temporaneo per guidare la risposta
                        messagesForAPI.push({
                            role: 'system',
                            content: 'Il messaggio dell\'utente è un semplice saluto. ' +
                                    'Rispondi in modo breve e conversazionale, con 1-2 frasi al massimo. ' +
                                    'Sii amichevole ma conciso. Non usare formattazioni speciali. ' +
                                    'Non usare le sezioni ANTIPASTI, PRIMI, SECONDI, DOLCI, INTERNE, ESTERNE, ESCURSIONI, ' +
                                    'SPECIALI, SETTIMANALI, STAGIONALI o altre formattazioni.'
                        });
                    } else if (needsFormat && messageDetection.isAboutMenu(userMessageText)) {
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
                        
                        processedContent = responseFormatter.fixCommonErrors(processedContent);
                        
                        // Se è un saluto, accorcia la risposta
                        if (isGreeting) {
                            processedContent = responseFormatter.shortenGreetingResponse(processedContent, userMessageText);
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
            // Restituisci un messaggio di errore chiaro invece di inventare una risposta
            return {
                content: "Mi scusi, si è verificato un errore nella connessione al servizio. Per favore riprovi tra poco.",
                role: 'assistant'
            };
        }
    }
}

module.exports = MistralApiClient;