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
        
        // Initialize handlers
        this.restaurantHandler = new RestaurantHandler();
        this.activitiesHandler = new ActivitiesHandler();
        this.eventsHandler = new EventsHandler();
        this.servicesHandler = new ServicesHandler();
        
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
            
            // Detect the language of the user's last message
            const detectedLanguage = this.languageProcessing.detectLanguage(message);
            
            // Check for various request types and route accordingly
            
            // 0. Check if it's a simple greeting for a minimal response
            if (this.languageProcessing.isSimpleGreeting(message)) {
                return await this.requestProcessors.handleSimpleGreeting(message, sessionId, detectedLanguage);
            }
            
            // 1. Check if it's a request for restaurant information
            if (this.restaurantHandler.isRestaurantInfoRequest(message)) {
                console.log(`[MistralService] Detected restaurant info request`);
                const restaurantResponse = this.restaurantHandler.handleRestaurantRequest(message);
                
                // Save to conversation history
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: restaurantResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: restaurantResponse,
                    sessionId: sessionId,
                    source: 'restaurant-info',
                    language: detectedLanguage
                };
            }
            
            // 2. Check if it's a request for activities
            if (this.activitiesHandler.isActivitiesInfoRequest(message)) {
                console.log(`[MistralService] Detected activities info request`);
                const activitiesResponse = this.activitiesHandler.handleActivitiesRequest(message);
                
                // Save to conversation history
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: activitiesResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: activitiesResponse,
                    sessionId: sessionId,
                    source: 'activities-info',
                    language: detectedLanguage
                };
            }
            
            // 3. Check if it's a request for events
            if (this.eventsHandler.isEventsInfoRequest(message)) {
                console.log(`[MistralService] Detected events info request`);
                const eventsResponse = this.eventsHandler.handleEventsRequest(message);
                
                // Save to conversation history
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: eventsResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: eventsResponse,
                    sessionId: sessionId,
                    source: 'events-info',
                    language: detectedLanguage
                };
            }
            
            // 4. Check if it's a request for services
            if (this.servicesHandler.isServicesInfoRequest(message)) {
                console.log(`[MistralService] Detected services info request`);
                const servicesResponse = this.servicesHandler.handleServicesRequest(message);
                
                // Save to conversation history
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: servicesResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: servicesResponse,
                    sessionId: sessionId,
                    source: 'services-info',
                    language: detectedLanguage
                };
            }
            
            // QUICK SOLUTION FOR RUSSIAN: If the language is Russian, ignore Mistral and use a predefined response
            if (detectedLanguage === 'ru' && this.languageProcessing.isRussian(message)) {
                return await this.requestProcessors.handleRussianMessage(message, sessionId);
            }
            
            // Handle restaurant booking requests
            if (this.restaurantHandler.isRestaurantBookingRequest(message)) {
                const restaurantResponse = this.restaurantHandler.handleRestaurantRequest(message);
                
                // Save to conversation history
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: restaurantResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: restaurantResponse,
                    sessionId: sessionId,
                    source: 'restaurant-system',
                    language: detectedLanguage
                };
            }
            
            // Check if the message is booking-related
            if (this.bookingIntegration.isBookingRelatedQuery(message) && userId) {
                const result = await this.requestProcessors.handleBookingQuery(message, sessionId, userId, detectedLanguage);
                if (result) {
                    return result;
                }
            }
            
            // If it's not a booking query or we didn't get a response,
            // proceed with the normal Mistral flow
            return await this.requestProcessors.processMistralAIRequest(message, sessionId, detectedLanguage);
            
        } catch (error) {
            console.error('Error processing message:', error);
            
            return this.requestProcessors.getErrorResponse(sessionId, detectedLanguage);
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