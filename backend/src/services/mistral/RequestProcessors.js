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
        
        // Aggiungiamo un controllo specifico per le domande sugli orari del ristorante
        const lowerMsg = message.toLowerCase();
        if (lowerMsg === "quali sono gli orari del ristorante?" || 
            lowerMsg.includes("orari del ristorante") || 
            lowerMsg.includes("quando apre il ristorante") || 
            (lowerMsg.includes("ristorante") && lowerMsg.includes("orari"))) {
            
            // For restaurant hours questions, override detected language to Italian
            // to ensure consistent response formatting
            if (detectedLanguage !== 'it') {
                console.log(`[RequestProcessors] Restaurant hours question detected with language '${detectedLanguage}', forcing Italian`);
                detectedLanguage = 'it';
            }
            
            console.log(`[RequestProcessors] Detected direct restaurant hours question, adding specific instruction`);
            
            // Aggiungiamo un'istruzione specifica e diretta alla fine della conversazione
            enrichedHistory.push({
                role: 'system',
                content: `IMPORTANTE: L'utente sta chiedendo informazioni sugli orari del ristorante. Questi sono gli orari CORRETTI da fornire:\n` +
                         `- Il ristorante è aperto TUTTI I GIORNI\n` +
                         `- Orari PRANZO: 12:30 - 14:30\n` + 
                         `- Orari CENA: 19:30 - 22:30\n` +
                         `- Per prenotazioni: telefono interno 122 o email ristorante@villapetriolo.com\n\n` +
                         `DEVI includere ESATTAMENTE questi orari nella tua risposta. NON dire che non hai informazioni sugli orari.`
            });
        }
        
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
        // Import JSON data
        const restaurantData = require('../../data/ristorante.json');
        const restaurantDataEn = require('../../data/restaurant.js');
        const attivitaData = require('../../data/attivita.json');
        const eventiData = require('../../data/eventi.json');
        const serviziData = require('../../data/servizi.json');
        
        if (topic === 'menu' || topic === 'ristorante') {
            // Get restaurant data
            const orari = restaurantData?.orari || {};
            const prenotazioni = restaurantData?.prenotazioni || {};
            const menu = restaurantData?.menu || {};
            
            let menuItems = '';
            if (menu.antipasti && menu.antipasti.length > 0) {
                const antipasti = menu.antipasti.map(item => `${item.nome} (€${item.prezzo})`).join(', ');
                menuItems += `- Antipasti: ${antipasti}\n`;
            }
            
            if (menu.primi && menu.primi.length > 0) {
                const primi = menu.primi.map(item => `${item.nome} (€${item.prezzo})`).join(', ');
                menuItems += `- Primi: ${primi}\n`;
            }
            
            if (menu.secondi && menu.secondi.length > 0) {
                const secondi = menu.secondi.map(item => `${item.nome} (€${item.prezzo})`).join(', ');
                menuItems += `- Secondi: ${secondi}\n`;
            }
            
            if (menu.dolci && menu.dolci.length > 0) {
                const dolci = menu.dolci.map(item => `${item.nome} (€${item.prezzo})`).join(', ');
                menuItems += `- Dolci: ${dolci}\n`;
            }
            
            return `INFORMAZIONI SUL RISTORANTE:\n` +
                   `- Orari pranzo: ${orari.pranzo || '12:30 - 14:30'}\n` +
                   `- Orari cena: ${orari.cena || '19:30 - 22:30'}\n` +
                   `- Aperto ${orari.giorni_apertura || 'tutti i giorni'}\n` +
                   `- Prenotazioni: ${prenotazioni.telefono || 'interno 122'} o ${prenotazioni.email || 'ristorante@villapetriolo.com'}\n\n` +
                   `MENU DISPONIBILE:\n` +
                   menuItems + '\n';
        } else if (topic === 'attivita') {
            // Get activities data
            const attivitaStruttura = attivitaData?.nella_struttura || [];
            const attivitaDintorni = attivitaData?.nei_dintorni || [];
            
            let attivitaInfo = `ATTIVITÀ DISPONIBILI:\n`;
            
            // Add activities in the structure
            if (attivitaStruttura.length > 0) {
                const attivitaList = attivitaStruttura.map(att => {
                    return `${att.nome} (${att.orari}, €${att.prezzo})`;
                }).join(', ');
                attivitaInfo += `- Nella struttura: ${attivitaList}\n`;
            }
            
            // Add activities in the surroundings
            if (attivitaDintorni.length > 0) {
                const dintorniList = attivitaDintorni.map(att => {
                    return `${att.nome} (${att.distanza}, €${att.prezzo})`;
                }).join(', ');
                attivitaInfo += `- Nei dintorni: ${dintorniList}\n`;
            }
            
            return attivitaInfo + '\n';
        } else if (topic === 'eventi') {
            // Get events data
            const eventi = eventiData?.eventi || [];
            const eventiSpeciali = eventiData?.eventi_speciali || [];
            
            let eventiInfo = `EVENTI IN PROGRAMMA:\n`;
            
            // Add regular events
            if (eventi.length > 0) {
                const eventiRegolari = eventi.map(evt => {
                    return `${evt.nome} (${evt.data}, ${evt.orario}, €${evt.prezzo})`;
                }).join(', ');
                eventiInfo += `- Settimanali: ${eventiRegolari}\n`;
            }
            
            // Add special events
            if (eventiSpeciali.length > 0) {
                const specialiList = eventiSpeciali.map(evt => {
                    return `${evt.nome} (${evt.data}, €${evt.prezzo})`;
                }).join(', ');
                eventiInfo += `- Speciali: ${specialiList}\n`;
            }
            
            return eventiInfo + '\n';
        } else if (topic === 'servizi') {
            // Get services data
            const serviziHotel = serviziData?.servizi_hotel || [];
            const serviziBenessere = serviziData?.servizi_benessere || [];
            const serviziExtra = serviziData?.servizi_extra || [];
            
            let serviziInfo = `SERVIZI DISPONIBILI:\n`;
            
            // Add hotel services
            if (serviziHotel.length > 0) {
                const hotelList = serviziHotel.map(srv => {
                    return `${srv.nome} (${srv.orari})`;
                }).join(', ');
                serviziInfo += `- Servizi base: ${hotelList}\n`;
            }
            
            // Add wellness services
            if (serviziBenessere.length > 0) {
                const benessereLista = serviziBenessere.map(srv => {
                    let priceInfo = srv.prezzo ? ` (${srv.prezzo})` : '';
                    return `${srv.nome}${priceInfo}`;
                }).join(', ');
                serviziInfo += `- Benessere: ${benessereLista}\n`;
            }
            
            // Add extra services
            if (serviziExtra.length > 0) {
                const extraList = serviziExtra.map(srv => {
                    let priceInfo = srv.prezzo ? ` (${srv.prezzo})` : '';
                    return `${srv.nome}${priceInfo}`;
                }).join(', ');
                serviziInfo += `- Extra: ${extraList}\n`;
            }
            
            return serviziInfo + '\n';
        } else {
            // Generic context with basic information from JSON data
            // Get basic info from each data source
            const orari = restaurantData?.orari || {};
            const attivitaStruttura = attivitaData?.nella_struttura || [];
            const serviziHotel = serviziData?.servizi_hotel || [];
            
            let generalInfo = `INFORMAZIONI GENERALI:\n`;
            
            // Restaurant info
            generalInfo += `- Ristorante: Pranzo ${orari.pranzo || '12:30-14:30'}, Cena ${orari.cena || '19:30-22:30'}, ${orari.giorni_apertura || 'tutti i giorni'}\n`;
            
            // Activities info
            if (attivitaStruttura.length > 0) {
                const attivitaList = attivitaStruttura.slice(0, 3).map(att => {
                    return `${att.nome} (€${att.prezzo})`;
                }).join(', ');
                generalInfo += `- Attività principali: ${attivitaList}\n`;
            }
            
            // Services info
            const serviziBasic = ['Wi-Fi', 'Reception', 'Spa e centro benessere'];
            const filtratiServizi = serviziHotel.filter(srv => {
                return serviziBasic.some(basic => srv.nome.includes(basic));
            });
            
            if (filtratiServizi.length > 0) {
                const serviziList = filtratiServizi.map(srv => {
                    if (srv.orari) {
                        return `${srv.nome} (${srv.orari})`;
                    }
                    return srv.nome;
                }).join(', ');
                generalInfo += `- Servizi: ${serviziList}\n`;
            }
            
            return generalInfo + '\n';
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