// src/services/mistral/MistralService.js
const MistralApiClient = require('./MistralApiClient');
const ConversationManager = require('./ConversationManager');
const MessageDetectionUtils = require('./MessageDetectionUtils');
const ResponseFormatter = require('./ResponseFormatter');
const BookingIntegration = require('./BookingIntegration');
const LanguageDetector = require('./LanguageDetector');
const MultiLanguageHandler = require('./MultiLanguageHandler');
const linguisticPatch = require('./linguistic-patch');

// Set DEBUG to true for detailed logging
const DEBUG = true;

class MistralService {
    constructor() {
        this.apiClient = new MistralApiClient();
        this.conversationManager = new ConversationManager();
        this.messageDetection = new MessageDetectionUtils();
        this.responseFormatter = new ResponseFormatter();
        this.bookingIntegration = BookingIntegration;
        this.languageDetector = new LanguageDetector();
        this.multiLanguageHandler = new MultiLanguageHandler();
    }

    async processMessage(message, sessionId, userId = null) {
        try {
            console.log(`Processing message for session ${sessionId}: "${message}"`);
            
            // Rileva la lingua dell'ultimo messaggio dell'utente
            console.log(`\n====== ANALISI MESSAGGIO UTENTE ======`);  
            console.log(`[MistralService] Messaggio utente: "${message}"`);          
            
            // Estrai i caratteri cirillici per verifica debug
            let cyrillicChars = message.match(/[\u0400-\u04FF]/g) || [];
            console.log(`[MistralService] Caratteri cirillici nel messaggio: ${cyrillicChars.length}`);
            if (cyrillicChars.length > 0) {
                console.log(`[MistralService] Caratteri cirillici: "${cyrillicChars.join('')}"`); 
            }
            
            // Usa il patcher linguistico per verificare se è russo
            const russianAnalysis = linguisticPatch.forceRussianDetection(message);
            console.log(`[MistralService] Analisi russo: ${JSON.stringify(russianAnalysis)}`);
            
            // Se è russo, forza l'impostazione della lingua
            let detectedLanguage;
            if (russianAnalysis.isRussian) {
                detectedLanguage = 'ru';
                console.log(`[MistralService] FORZATO RILEVAMENTO: RUSSO (per presenza caratteri cirillici)`);  
            } else {
                // Altrimenti usa il normale rilevamento linguistico
                detectedLanguage = this.languageDetector.detect(message);
            }
            
            console.log(`[MistralService] *********** LINGUA RILEVATA: ${detectedLanguage} ***********`);
            console.log('====== FINE ANALISI MESSAGGIO UTENTE ======\n');
            
            // SOLUZIONE RAPIDA PER IL RUSSO: Se la lingua è russa, ignora Mistral e usa una risposta predefinita
            if (detectedLanguage === 'ru' && russianAnalysis.isRussian) {
                console.log(`[MistralService] SOLUZIONE IMMEDIATA: Messaggio in russo rilevato, uso risposta predefinita`);
                // Ottieni una risposta predefinita in russo
                const russianResponse = linguisticPatch.getRussianFallbackResponse();
                
                // Salva nella storia della conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                
                // Aggiungi il messaggio utente alla storia
                history.push({
                    role: 'user',
                    content: message
                });
                
                // Aggiungi la risposta russa predefinita
                history.push({
                    role: 'assistant',
                    content: russianResponse
                });
                
                // Aggiorna la storia
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: russianResponse,
                    sessionId: sessionId,
                    source: 'russian-fallback',
                    language: 'ru'
                };
            }
            
            // Gestione per richieste ristorante
            if (this.isRestaurantBookingRequest(message)) {
                const restaurantResponse = this.handleRestaurantRequest(message);
                
                // Salva nella storia della conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                
                // Aggiungi il messaggio utente alla storia
                history.push({
                    role: 'user',
                    content: message
                });
                
                // Aggiungi la risposta come messaggio dell'assistente
                history.push({
                    role: 'assistant',
                    content: restaurantResponse
                });
                
                // Aggiorna la storia
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: restaurantResponse,
                    sessionId: sessionId,
                    source: 'restaurant-system',
                    language: detectedLanguage
                };
            }
            
            // Verifica se il messaggio è relativo alle prenotazioni
            if (this.bookingIntegration.isBookingRelatedQuery(message) && userId) {
                const bookingResponse = await this.bookingIntegration.handleBookingQuery(message, userId);
                
                if (bookingResponse) {
                    // Se abbiamo una risposta valida dalla gestione prenotazioni, la utilizziamo
                    // e la memorizziamo nella storia della conversazione
                    const history = await this.conversationManager.getConversationHistory(sessionId);
                    
                    // Aggiungi il messaggio utente alla storia
                    history.push({
                        role: 'user',
                        content: message
                    });
                    
                    // Aggiungi la risposta del sistema di prenotazione come messaggio dell'assistente
                    history.push({
                        role: 'assistant',
                        content: bookingResponse
                    });
                    
                    // Aggiorna la storia
                    await this.conversationManager.updateConversationHistory(sessionId, history);
                    
                    return {
                        message: bookingResponse,
                        sessionId: sessionId,
                        source: 'booking-system',
                        language: detectedLanguage
                    };
                }
            }
            
            // Se non è una query di prenotazione o non abbiamo ottenuto una risposta,
            // procedi con il normale flusso Mistral
            
            // Get conversation history
            const history = await this.conversationManager.getConversationHistory(sessionId);
            
            // Add user message to history
            history.push({
                role: 'user',
                content: message
            });
            
            // Get response from API
            const response = await this.apiClient.callMistralAPI(history, message, this.messageDetection, this.responseFormatter);
            let assistantMessage = response.content;
            
            if (DEBUG) console.log(`Got assistant response: "${assistantMessage}"`);
            
            // Check if the language of the response matches the detected language of the user message
            console.log(`\n====== ANALISI RISPOSTA MISTRAL ======`);
            console.log(`[MistralService] Risposta originale da Mistral: "${assistantMessage}"`);
            console.log(`[MistralService] Lingua rilevata nel messaggio utente: ${detectedLanguage}`);
            
            // Verifica la correttezza linguistica della risposta
            try {
                // Verifica se è un saluto semplice per usare template predefiniti
                if (this.messageDetection.isSimpleGreeting(message)) {
                    const originalResponse = assistantMessage;
                    assistantMessage = this.multiLanguageHandler.getRandomGreeting(detectedLanguage);
                    console.log(`[MistralService] Era un saluto semplice, sostituisco con greeting template`);
                    console.log(`[MistralService] PRIMA: "${originalResponse}"`);
                    console.log(`[MistralService] DOPO: "${assistantMessage}"`);
                } else {
                    // Analisi approfondita della risposta per verificare la correttezza linguistica
                    console.log('[MistralService] Analisi linguistica della risposta:');
                    
                    // Utilizza la funzione migliorata di linguisticPatch
                    const isResponseCorrect = linguisticPatch.isResponseInCorrectLanguage(assistantMessage, detectedLanguage);
                    console.log(`[MistralService] - Risposta nella lingua corretta: ${isResponseCorrect}`);
                    
                    // Per il russo, implementiamo una soluzione speciale per garantire la risposta corretta
                    if (detectedLanguage === 'ru') {
                        const isResponseRussian = linguisticPatch.isResponseInCorrectLanguage(assistantMessage, 'ru');
                        console.log(`[MistralService] Risposta in russo? ${isResponseRussian}`);
                        
                        if (!isResponseRussian) {
                            console.log(`[MistralService] ERRORE: La risposta non è in russo. Sostituisco con risposta preimpostata.`);
                            assistantMessage = linguisticPatch.getRussianFallbackResponse();
                            console.log(`[MistralService] Risposta finale: "${assistantMessage}"`);
                        }
                    }
                    // Se la risposta non è nella lingua corretta, usa il sistema avanzato di fallback
                    else if (!isResponseCorrect) {
                        console.log(`[MistralService] ATTENZIONE: La risposta non è nella lingua corretta: ${detectedLanguage}`);
                        
                        // Try-catch per gestire eventuali errori nel processo di traduzione
                        try {
                            const originalResponse = assistantMessage;
                            // Usa il nuovo sistema di traduzione fallback
                            assistantMessage = await linguisticPatch.translateWithFallback(assistantMessage, detectedLanguage);
                            console.log(`[MistralService] Applicato fallback linguistico:`);
                            console.log(`[MistralService] PRIMA: "${originalResponse.substring(0, 100)}..."`);
                            console.log(`[MistralService] DOPO: "${assistantMessage.substring(0, 100)}..."`);
                            
                            // Verifica speciale per il menu
                            if (this.messageDetection.isAboutMenu(message)) {
                                assistantMessage = this.multiLanguageHandler.localizeMenuSections(assistantMessage, detectedLanguage);
                                console.log(`[MistralService] Localizzazione aggiuntiva sezioni menu`);
                            }
                        } catch (translationError) {
                            console.error(`[MistralService] Errore durante il fallback linguistico:`, translationError);
                            // Fallback finale: usa un messaggio di errore predefinito nella lingua corretta
                            assistantMessage = this.multiLanguageHandler.getErrorMessage(detectedLanguage);
                        }
                    }
                }
            } catch (languageProcessingError) {
                console.error('[MistralService] Errore durante l\'elaborazione linguistica:', languageProcessingError);
                // Non interrompere il flusso, lascia la risposta originale
            }
            
            console.log(`====== FINE ANALISI RISPOSTA MISTRAL ======\n`);
            
            // Add assistant response to history
            history.push({
                role: 'assistant',
                content: assistantMessage
            });
            
            // Update conversation history
            await this.conversationManager.updateConversationHistory(sessionId, history);
            
            return {
                message: assistantMessage,
                sessionId: sessionId,
                source: 'mistral-ai',
                language: detectedLanguage
            };
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Return a fallback response in case of error
            return {
                message: "Mi scusi, si è verificato un errore nella comunicazione. Può riprovare tra qualche istante?",
                sessionId: sessionId,
                error: true,
                source: 'error-handler',
                language: detectedLanguage || 'it'
            };
        }
    }

    // Nuova funzione per identificare le richieste di prenotazione ristorante
    isRestaurantBookingRequest(message) {
        const lowerMsg = message.toLowerCase();
        const restaurantKeywords = [
            'prenota', 'tavolo', 'ristorante', 'cena', 'pranzo', 'mangiare',
            'prenotare', 'riservare', 'posto', 'bistrot', 'stasera', 'domani'
        ];
        
        return restaurantKeywords.some(keyword => lowerMsg.includes(keyword));
    }

    // Nuova funzione per gestire le richieste di prenotazione ristorante
    handleRestaurantRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // Se è una richiesta diretta di prenotazione
        if (lowerMsg.includes('prenota') || lowerMsg.includes('prenotare') || 
            lowerMsg.includes('riservare') || lowerMsg.includes('vorrei un tavolo')) {
            
            return "Sarei felice di aiutarla con la prenotazione al nostro ristorante. " +
                   "Per procedere, avrei bisogno delle seguenti informazioni:\n\n" +
                   "- Data e orario desiderati\n" +
                   "- Numero di persone\n" +
                   "- Eventuali richieste speciali (es. tavolo all'aperto, menu per celiaci, ecc.)\n\n" +
                   "Potrebbe fornirmi questi dettagli? In alternativa, posso anche metterla in contatto " +
                   "direttamente con il nostro staff di ristorazione al numero interno 122 o via email a " +
                   "ristorante@villapetriolo.com";
        }
        
        // Se è una richiesta di informazioni sul ristorante
        if (lowerMsg.includes('orari') || lowerMsg.includes('menu') || 
            lowerMsg.includes('specialità') || lowerMsg.includes('piatti')) {
            
            return "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n\n" +
                   "ORARI:\n" +
                   "- Pranzo: 12:30 - 14:30\n" +
                   "- Cena: 19:30 - 22:30\n\n" +
                   "Se desidera prenotare un tavolo o avere informazioni sul menu del giorno, " +
                   "sarò felice di assisterla. Posso anche metterla in contatto con il nostro " +
                   "staff di ristorazione per richieste particolari.";
        }
        
        // Risposta generica per altre richieste relative al ristorante
        return "Il nostro ristorante offre un'esperienza culinaria unica con piatti della tradizione " +
               "toscana rivisitati in chiave moderna. Posso aiutarla con informazioni su orari, menu " +
               "o per assistenza nella prenotazione di un tavolo. Mi faccia sapere come posso esserle utile.";
    }

    async clearHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Clearing history for session ${sessionId}`);
            
            await this.conversationManager.clearHistory(sessionId);
            
            // Reinitialize the conversation
            await this.conversationManager.initializeConversation(sessionId);
            
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

    async initializeConversation(sessionId) {
        try {
            await this.conversationManager.initializeConversation(sessionId);
            return true;
        } catch (error) {
            console.error('Error initializing conversation:', error);
            throw error;
        }
    }
}

module.exports = MistralService;