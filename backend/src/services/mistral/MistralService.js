// src/services/mistral/MistralService.js
const MistralApiClient = require('./MistralApiClient');
const ConversationManager = require('./ConversationManager');
const MessageDetectionUtils = require('./MessageDetectionUtils');
const ResponseFormatter = require('./ResponseFormatter');
const BookingIntegration = require('./BookingIntegration');
const LanguageDetector = require('./LanguageDetector');
const MultiLanguageHandler = require('./MultiLanguageHandler');
const linguisticPatch = require('./linguistic-patch');
const LanguageProcessing = require('./LanguageProcessing');
const RequestProcessors = require('./RequestProcessors');

// Import handlers
const RestaurantHandler = require('./handlers/RestaurantHandler');
const ActivitiesHandler = require('./handlers/ActivitiesHandler');
const EventsHandler = require('./handlers/EventsHandler');
const ServicesHandler = require('./handlers/ServicesHandler');

// Import data
const restaurantData = require('../../data/ristorante.json');
const restaurantDataEn = require('../../data/restaurant.js');
const attivitaData = require('../../data/attivita.json');
const eventiData = require('../../data/eventi.json');
const serviziData = require('../../data/servizi.json');

// Set DEBUG to true for detailed logging
const DEBUG = true;

class MistralService {
    constructor() {
        // Initialize core services
        this.apiClient = new MistralApiClient();
        this.conversationManager = new ConversationManager();
        this.messageDetection = new MessageDetectionUtils();
        this.responseFormatter = new ResponseFormatter();
        this.bookingIntegration = BookingIntegration;
        this.languageDetector = new LanguageDetector();
        this.multiLanguageHandler = new MultiLanguageHandler();
        
        // Initialize utility classes
        this.languageProcessing = new LanguageProcessing(this.languageDetector, linguisticPatch);
        
        // Initialize handlers with data
        this.restaurantHandler = new RestaurantHandler(restaurantData || {});
        this.activitiesHandler = new ActivitiesHandler(attivitaData || {});
        this.eventsHandler = new EventsHandler(eventiData || {});
        this.servicesHandler = new ServicesHandler(serviziData || {});
        
        // Initialize request processors
        this.requestProcessors = new RequestProcessors({
            conversationManager: this.conversationManager,
            apiClient: this.apiClient,
            multiLanguageHandler: this.multiLanguageHandler,
            messageDetection: this.messageDetection,
            responseFormatter: this.responseFormatter,
            languageProcessing: this.languageProcessing,
            linguisticPatch: linguisticPatch,
            bookingIntegration: this.bookingIntegration
        });
    }

    async processMessage(message, sessionId, userId = null) {
        try {
            console.log(`Processing message for session ${sessionId}: "${message}"`);
            
            // Detect language
            const detectedLanguage = this.languageProcessing.detectLanguage(message);
            console.log(`Detected language: ${detectedLanguage}`);
            
            // TUTTO DEVE ESSERE GESTITO DALL'AI - NESSUN FALLBACK
            // Invia la richiesta direttamente all'AI senza intercettazioni
            const response = await this.requestProcessors.processMistralAIRequest(message, sessionId, detectedLanguage);
            
            return response;
            
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Fallback solo in caso di errore
            return {
                message: "Si è verificato un errore di sistema. Riprova tra qualche istante.",
                sessionId: sessionId,
                error: true,
                source: 'error-handler',
                language: 'it'
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