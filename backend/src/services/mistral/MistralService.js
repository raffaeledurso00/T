// src/services/mistral/MistralService.js
const MistralApiClient = require('./MistralApiClient');
const ConversationManager = require('./ConversationManager');
const MessageDetectionUtils = require('./MessageDetectionUtils');
const ResponseFormatter = require('./ResponseFormatter');
const BookingIntegration = require('./BookingIntegration');

// Set DEBUG to true for detailed logging
const DEBUG = false;

// Modifiche da applicare a backend/src/services/mistral/MistralService.js

class MistralService {
    constructor() {
        this.apiClient = new MistralApiClient();
        this.conversationManager = new ConversationManager();
        this.messageDetection = new MessageDetectionUtils();
        this.responseFormatter = new ResponseFormatter();
        this.bookingIntegration = BookingIntegration;
    }

    async processMessage(message, sessionId, userId = null) {
        try {
            if (DEBUG) console.log(`Processing message for session ${sessionId}: "${message}"`);
            
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
                    source: 'restaurant-system'
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
                        source: 'booking-system'
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
            const assistantMessage = response.content;
            
            if (DEBUG) console.log(`Got assistant response: "${assistantMessage}"`);
            
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
                source: 'mistral-ai'
            };
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Return a fallback response in case of error
            return {
                message: "Mi scusi, si è verificato un errore nella comunicazione. Può riprovare tra qualche istante?",
                sessionId: sessionId,
                error: true,
                source: 'error-handler'
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