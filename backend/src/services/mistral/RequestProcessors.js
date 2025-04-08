// src/services/mistral/RequestProcessors.js

/**
 * Contains methods for processing different types of requests
 */
class RequestProcessors {
    constructor(dependencies) {
        // Extract dependencies
        const {
            conversationManager,
            apiClient,
            multiLanguageHandler,
            messageDetection,
            responseFormatter,
            languageProcessing,
            linguisticPatch
        } = dependencies;
        
        this.conversationManager = conversationManager;
        this.apiClient = apiClient;
        this.multiLanguageHandler = multiLanguageHandler;
        this.messageDetection = messageDetection;
        this.responseFormatter = responseFormatter;
        this.languageProcessing = languageProcessing;
        this.linguisticPatch = linguisticPatch;
        
        // Debug mode
        this.DEBUG = true;
    }
    
    /**
     * Handles simple greeting messages
     * @param {string} message - User message
     * @param {string} sessionId - Session ID
     * @param {string} detectedLanguage - Detected language
     * @returns {Object} - Response object
     */
    async handleSimpleGreeting(message, sessionId, detectedLanguage) {
        console.log(`[RequestProcessors] Detected simple greeting`);
        const response = this.multiLanguageHandler.getRandomGreeting(detectedLanguage);
        
        // Save to conversation history
        const history = await this.conversationManager.getConversationHistory(sessionId);
        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: response });
        await this.conversationManager.updateConversationHistory(sessionId, history);
        
        return {
            message: response,
            sessionId: sessionId,
            source: 'greeting-handler',
            language: detectedLanguage
        };
    }
    
    /**
     * Handles Russian language messages with predefined responses
     * @param {string} message - User message
     * @param {string} sessionId - Session ID
     * @returns {Object} - Response object
     */
    async handleRussianMessage(message, sessionId) {
        console.log(`[RequestProcessors] IMMEDIATE SOLUTION: Russian message detected, using predefined response`);
        // Get a predefined Russian response
        const russianResponse = this.linguisticPatch.getRussianFallbackResponse();
        
        // Save to conversation history
        const history = await this.conversationManager.getConversationHistory(sessionId);
        
        // Add user message to history
        history.push({
            role: 'user',
            content: message
        });
        
        // Add predefined Russian response
        history.push({
            role: 'assistant',
            content: russianResponse
        });
        
        // Update history
        await this.conversationManager.updateConversationHistory(sessionId, history);
        
        return {
            message: russianResponse,
            sessionId: sessionId,
            source: 'russian-fallback',
            language: 'ru'
        };
    }
    
    /**
     * Handles booking-related queries
     * @param {string} message - User message
     * @param {string} sessionId - Session ID
     * @param {string} userId - User ID
     * @param {string} detectedLanguage - Detected language
     * @returns {Object|null} - Response object or null if booking is not handled
     */
    async handleBookingQuery(message, sessionId, userId, detectedLanguage) {
        const bookingResponse = await this.bookingIntegration.handleBookingQuery(message, userId);
        
        if (bookingResponse) {
            // If we have a valid response from the booking system, use and store it in conversation history
            const history = await this.conversationManager.getConversationHistory(sessionId);
            
            // Add user message to history
            history.push({
                role: 'user',
                content: message
            });
            
            // Add booking system response as assistant message
            history.push({
                role: 'assistant',
                content: bookingResponse
            });
            
            // Update history
            await this.conversationManager.updateConversationHistory(sessionId, history);
            
            return {
                message: bookingResponse,
                sessionId: sessionId,
                source: 'booking-system',
                language: detectedLanguage
            };
        }
        
        return null;
    }
    
    /**
     * Process general Mistral AI requests
     * @param {string} message - User message
     * @param {string} sessionId - Session ID
     * @param {string} detectedLanguage - Detected language
     * @returns {Object} - Response object
     */
    async processMistralAIRequest(message, sessionId, detectedLanguage) {
        // Get conversation history
        const history = await this.conversationManager.getConversationHistory(sessionId);
        
        // Add user message to history
        history.push({
            role: 'user',
            content: message
        });
        
        // Analyze conversation context
        const topic = this.languageProcessing.detectMessageTopic(message);
        console.log(`[RequestProcessors] Detected topic for system prompt: ${topic}`);
        
        // Prepare a base context
        let contextContent = this.prepareBaseContext();
        
        // Add specific information based on detected topic
        contextContent += this.getTopicSpecificContext(topic);
        
        // Create system prompt with enriched context
        const contextPrompt = {
            role: 'system',
            content: contextContent
        };
        
        // Enrich history with context
        const enrichedHistory = [contextPrompt, ...history];
        
        // Get response from API
        const response = await this.apiClient.callMistralAPI(
            enrichedHistory, 
            message, 
            this.messageDetection, 
            this.responseFormatter
        );
        
        let assistantMessage = response.content;
        
        if (this.DEBUG) console.log(`Got assistant response: "${assistantMessage}"`);
        
        // Check if the language of the response matches the detected language of the user message
        console.log(`\n====== ANALYZING MISTRAL RESPONSE ======`);
        console.log(`[RequestProcessors] Original response from Mistral: "${assistantMessage}"`);
        console.log(`[RequestProcessors] Detected language in user message: ${detectedLanguage}`);
        
        // Verify linguistic correctness of the response
        assistantMessage = await this.ensureCorrectLanguage(message, assistantMessage, detectedLanguage);
        
        console.log(`====== END OF MISTRAL RESPONSE ANALYSIS ======\n`);
        
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
    }
    
    /**
     * Prepares base context for AI prompts
     * @returns {string} - Base context content
     */
    prepareBaseContext() {
        let contextContent = `Sei il concierge digitale di Villa Petriolo. IMPORTANTE: Sii MOLTO CONCISO nelle tue risposte. `;
        contextContent += `Le tue risposte devono essere brevi, precise e dirette. MAI più di 2-3 frasi per risposte generali, massimo 5-6 righe per informazioni specifiche. `;
        contextContent += `NON aggiungere informazioni non richieste. NON elencare tutti i servizi disponibili a meno che non sia espressamente richiesto.\n\n`;
        
        return contextContent;
    }
    
    /**
     * Gets context specific to a topic
     * @param {string} topic - Detected topic
     * @returns {string} - Topic-specific context
     */
    getTopicSpecificContext(topic) {
        if (topic === 'menu') {
            return `INFORMAZIONI SUL RISTORANTE:\n` +
                   `- Orari pranzo: 12:30 - 14:30\n` +
                   `- Orari cena: 19:30 - 22:30\n` +
                   `- Aperto tutti i giorni\n\n` +
                   `MENU DISPONIBILE:\n` +
                   `- Antipasti: Carpaccio di manzo (€16), Burrata con pomodorini (€14), Tagliere di salumi (€18)\n` +
                   `- Primi: Pappardelle al ragù di cinghiale (€18), Risotto ai funghi porcini (€16)\n` +
                   `- Secondi: Bistecca alla fiorentina (€70 per 2), Filetto di branzino (€24)\n` +
                   `- Dolci: Tiramisù (€8), Panna cotta (€8), Cantucci e Vin Santo (€10)\n\n`;
        } else if (topic === 'attivita') {
            return `ATTIVITÀ DISPONIBILI:\n` +
                   `- Nella struttura: Degustazione vini (17:00, €35), Corso di cucina (lun/mer/ven 10:00, €65)\n` +
                   `- Passeggiata guidata nel bosco (mar/gio 9:30, €20), Yoga nel parco (ogni giorno 8:00, €15)\n` +
                   `- Nei dintorni: Tour del Chianti (mezza giornata, €85), Visita a San Gimignano (€60)\n\n`;
        } else if (topic === 'eventi') {
            return `EVENTI IN PROGRAMMA:\n` +
                   `- Settimanali: Degustazione olio (martedì, 19:00, €25), Concerto dal vivo (venerdì, 21:00, €15)\n` +
                   `- Aperitivo al tramonto (ogni giorno, 18:30, €20)\n` +
                   `- Speciali: Festival del Vino (primo weekend del mese, €75), Cooking Masterclass (ultimo sabato, €120)\n\n`;
        } else if (topic === 'servizi') {
            return `SERVIZI DISPONIBILI:\n` +
                   `- Servizi base: Reception (24h), Servizio in camera (7:00-23:00), Wi-Fi gratuito, Parcheggio\n` +
                   `- Benessere: Spa (10:00-20:00), Massaggi (da €60), Piscina esterna (8:00-19:00, mag-set)\n` +
                   `- Extra: Trasferimento aeroporto (da €80), Noleggio biciclette (€15/ora), Servizio lavanderia\n\n`;
        } else {
            // Generic context with basic information
            return `INFORMAZIONI GENERALI:\n` +
                   `- Ristorante: Pranzo 12:30-14:30, Cena 19:30-22:30, tutti i giorni\n` +
                   `- Attività principali: Degustazione vini (€35), Corso di cucina (€65), Yoga (€15)\n` +
                   `- Servizi: Wi-Fi gratuito, Reception 24h, Spa e centro benessere (10:00-20:00)\n\n`;
        }
        
        // Add an important note to ensure accurate responses
        return contextContent + `IMPORTANTE: Fornisci sempre orari e prezzi precisi quando richiesti. NON essere prolisso, risposte brevi e dirette.`;
    }
    
    /**
     * Ensures the response is in the correct language
     * @param {string} message - Original user message
     * @param {string} assistantMessage - AI response to check
     * @param {string} detectedLanguage - Expected language
     * @returns {string} - Corrected response
     */
    async ensureCorrectLanguage(message, assistantMessage, detectedLanguage) {
        try {
            // Check if it's a simple greeting to use predefined templates
            if (this.languageProcessing.isSimpleGreeting(message)) {
                const originalResponse = assistantMessage;
                assistantMessage = this.multiLanguageHandler.getRandomGreeting(detectedLanguage);
                console.log(`[RequestProcessors] It was a simple greeting, replacing with greeting template`);
                console.log(`[RequestProcessors] BEFORE: "${originalResponse}"`);
                console.log(`[RequestProcessors] AFTER: "${assistantMessage}"`);
            } else {
                // Deep analysis of response to verify linguistic correctness
                console.log('[RequestProcessors] Linguistic analysis of response:');
                
                // Use the improved function of linguisticPatch
                const isResponseCorrect = this.languageProcessing.isResponseInCorrectLanguage(assistantMessage, detectedLanguage);
                console.log(`[RequestProcessors] - Response in correct language: ${isResponseCorrect}`);
                
                // For Russian, implement a special solution to ensure correct response
                if (detectedLanguage === 'ru') {
                    const isResponseRussian = this.languageProcessing.isResponseInCorrectLanguage(assistantMessage, 'ru');
                    console.log(`[RequestProcessors] Is response in Russian? ${isResponseRussian}`);
                    
                    if (!isResponseRussian) {
                        console.log(`[RequestProcessors] ERROR: Response is not in Russian. Replacing with preset response.`);
                        assistantMessage = this.linguisticPatch.getRussianFallbackResponse();
                        console.log(`[RequestProcessors] Final response: "${assistantMessage}"`);
                    }
                }
                // If the response is not in the correct language, use the advanced fallback system
                else if (!isResponseCorrect) {
                    console.log(`[RequestProcessors] WARNING: Response is not in the correct language: ${detectedLanguage}`);
                    
                    // Try-catch to handle any errors in the translation process
                    try {
                        const originalResponse = assistantMessage;
                        // Use the new fallback translation system
                        assistantMessage = await this.linguisticPatch.translateWithFallback(assistantMessage, detectedLanguage);
                        console.log(`[RequestProcessors] Applied linguistic fallback:`);
                        console.log(`[RequestProcessors] BEFORE: "${originalResponse.substring(0, 100)}..."`);
                        console.log(`[RequestProcessors] AFTER: "${assistantMessage.substring(0, 100)}..."`);
                        
                        // Special check for menu
                        if (this.messageDetection.isAboutMenu(message)) {
                            assistantMessage = this.multiLanguageHandler.localizeMenuSections(assistantMessage, detectedLanguage);
                            console.log(`[RequestProcessors] Additional localization of menu sections`);
                        }
                    } catch (translationError) {
                        console.error(`[RequestProcessors] Error during linguistic fallback:`, translationError);
                        // Final fallback: use a predefined error message in the correct language
                        assistantMessage = this.multiLanguageHandler.getErrorMessage(detectedLanguage);
                    }
                }
            }
        } catch (languageProcessingError) {
            console.error('[RequestProcessors] Error during language processing:', languageProcessingError);
            // Don't interrupt the flow, leave the original response
        }
        
        return assistantMessage;
    }
    
    /**
     * Returns a fallback error response
     * @param {string} sessionId - Session ID
     * @param {string} detectedLanguage - Detected language
     * @returns {Object} - Error response object
     */
    getErrorResponse(sessionId, detectedLanguage) {
        return {
            message: "Mi scusi, si è verificato un errore nella comunicazione. Può riprovare tra qualche istante?",
            sessionId: sessionId,
            error: true,
            source: 'error-handler',
            language: detectedLanguage || 'it'
        };
    }
}

module.exports = RequestProcessors;