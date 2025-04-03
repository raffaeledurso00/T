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

// Modifiche da applicare a backend/src/services/mistral/MistralService.js

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
            
            // Aggiungiamo debug FORZATO per il rilevamento lingua
            console.log('\n====== INIZIO ANALISI MESSAGGIO UTENTE ======');
            console.log(`[MistralService] Messaggio completo: "${message}"`);
            console.log(`[MistralService] Controllo caratteri cirillici:`);
            
            // Test esplicito per cirillico con output completo
            const cyrillicRegEx = /[\u0400-\u04FF]/;
            const hasCyrillic = cyrillicRegEx.test(message);
            console.log(`[MistralService] Test RegEx cirillico: ${hasCyrillic}`);
            
            // Verifica carattere per carattere
            Array.from(message).forEach((char, index) => {
                const code = char.charCodeAt(0);
                const isCyrillic = (code >= 0x0400 && code <= 0x04FF);
                console.log(`[MistralService] Char[${index}]: '${char}', Unicode: ${code}, Hex: 0x${code.toString(16)}, Cirillico: ${isCyrillic}`);
            });
            
            // Test con altre espressioni regolari
            const alternativeRegex = /[А-Яа-я]/;
            console.log(`[MistralService] Test alternativo cirillico [А-Яа-я]: ${alternativeRegex.test(message)}`);
            
            // Esegui il rilevamento della lingua con la patch per forzare russo
            let detectedLanguage;
            if (hasCyrillic || alternativeRegex.test(message)) {
                detectedLanguage = 'ru'; // Forza russo se ci sono caratteri cirillici
                console.log(`[MistralService] Forzato rilevamento lingua: RUSSO (per presenza caratteri cirillici)`);
            } else {
                detectedLanguage = this.languageDetector.detect(message);
            }
            
            console.log(`[MistralService] *********** LINGUA RILEVATA: ${detectedLanguage} ***********`);
            console.log('====== FINE ANALISI MESSAGGIO UTENTE ======\n');
            
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
            
            // Se è un saluto semplice, usa i template predefiniti nella lingua rilevata
            if (this.messageDetection.isSimpleGreeting(message)) {
                const originalResponse = assistantMessage;
                assistantMessage = this.multiLanguageHandler.getRandomGreeting(detectedLanguage);
                console.log(`[MistralService] Era un saluto semplice, sostituisco con greeting template`);
                console.log(`[MistralService] PRIMA: "${originalResponse}"`);
                console.log(`[MistralService] DOPO: "${assistantMessage}"`);
            }
            // Altrimenti, traduci la risposta se Mistral non ha rispettato la lingua rilevata
            else {
                // Possiamo provare a verificare se la lingua della risposta è quella rilevata
                const responseLanguage = this.languageDetector.detect(assistantMessage);
                console.log(`[MistralService] Lingua rilevata nella risposta Mistral: ${responseLanguage}`);
                
                // Test approfondito sulla risposta per verificare la correttezza linguistica
                console.log('[MistralService] Analisi approfondita della risposta:');
                
                // Verifica caratteri specifici
                const hasCyrillicResponse = /[\u0400-\u04FF]/.test(assistantMessage);
                const hasChineseResponse = /[\u4e00-\u9fff]/.test(assistantMessage);
                console.log(`[MistralService] - Contiene caratteri cirillici: ${hasCyrillicResponse}`);
                console.log(`[MistralService] - Contiene caratteri cinesi: ${hasChineseResponse}`);
                
                // Verifica con il patcher linguistico
                const isResponseCorrect = linguisticPatch.isResponseInCorrectLanguage(assistantMessage, detectedLanguage);
                console.log(`[MistralService] - Qualità linguistica verificata: ${isResponseCorrect}`);
                
                // Per il russo specificamente, verifichiamo se è necessario forzare una risposta in russo
                if (detectedLanguage === 'ru' && !hasCyrillicResponse) {
                    console.log(`[MistralService] ATTENZIONE: La risposta NON contiene caratteri cirillici per una richiesta in russo`);
                    
                    // Ottieni un messaggio di errore in russo dal gestore multilingua
                    const originalResponse = assistantMessage;
                    assistantMessage = this.multiLanguageHandler.getErrorMessage('ru');
                    console.log(`[MistralService] Sostituzione forzata con risposta fallback in russo:`);
                    console.log(`[MistralService] PRIMA: "${originalResponse.substring(0, 100)}..."`);
                    console.log(`[MistralService] DOPO: "${assistantMessage}"`);
                }
                // Gestione normale per altre lingue o quando la lingua rilevata non corrisponde
                else if (responseLanguage !== detectedLanguage || !isResponseCorrect) {
                    console.log(`[MistralService] ATTENZIONE: La lingua della risposta (${responseLanguage}) non corrisponde alla lingua dell'utente (${detectedLanguage})`);
                    
                    // Verifico se è una risposta per un menu
                    if (this.messageDetection.isAboutMenu(message)) {
                        const originalResponse = assistantMessage;
                        assistantMessage = this.multiLanguageHandler.localizeMenuSections(assistantMessage, detectedLanguage);
                        console.log(`[MistralService] Localizzazione delle sezioni menu dopo fallback:`);
                        console.log(`[MistralService] PRIMA: "${originalResponse.substring(0, 100)}..."`);
                        console.log(`[MistralService] DOPO: "${assistantMessage.substring(0, 100)}..."`);
                    }
                    
                    // Se continua a non rispettare la lingua, usa un messaggio di errore nella lingua corretta
                    if (!linguisticPatch.isResponseInCorrectLanguage(assistantMessage, detectedLanguage)) {
                        console.log(`[MistralService] *** PROBLEMATICO: La risposta è ancora nella lingua sbagliata, uso fallback ***`);
                        const originalResponse = assistantMessage;
                        assistantMessage = this.multiLanguageHandler.getErrorMessage(detectedLanguage);
                        console.log(`[MistralService] PRIMA: "${originalResponse.substring(0, 100)}..."`);
                        console.log(`[MistralService] DOPO: "${assistantMessage}"`);
                    }
                }
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