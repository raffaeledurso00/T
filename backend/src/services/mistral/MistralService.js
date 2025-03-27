// src/services/mistral/MistralService.js
const MistralApiClient = require('./MistralApiClient');
const ConversationManager = require('./ConversationManager');
const MessageDetectionUtils = require('./MessageDetectionUtils');
const ResponseFormatter = require('./ResponseFormatter');
const BookingIntegration = require('./BookingIntegration');

// Set DEBUG to true for detailed logging
const DEBUG = false;

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