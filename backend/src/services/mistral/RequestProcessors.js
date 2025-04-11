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
     * Process general Mistral AI requests - questo è l'unico metodo che verrà usato
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
        
        // Prepare a base context
        let contextContent = this.prepareBaseContext();
        
        // Add specific information based on topics
        contextContent += this.getGeneralContext();
        
        // Get context from AI - assicuriamoci che risponda in modo appropriato
        let contextPrompt = {
            role: 'system',
            content: `${contextContent}

IMPORTANT INSTRUCTIONS:
1. You MUST respond in the same language as the user's message (${detectedLanguage}).
2. Keep your responses friendly, direct and concise.
3. Restaurant hours: Lunch 12:30-14:30, Dinner 19:30-22:30, open every day.
4. When speaking Chinese, use simplified Chinese characters.
5. Handle any topic naturally as a knowledgeable concierge would.
6. NEVER refuse to answer or say you don't have information about Villa Petriolo.
7. Always provide helpful, accurate information about any aspect of the villa or the surrounding area.
`
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
        let contextContent = `Sei il concierge digitale di Villa Petriolo, una lussuosa villa in Toscana. `;
        contextContent += `Le tue risposte devono essere precise, utili e naturali. Fornisci informazioni accurate su qualsiasi aspetto della villa o della zona circostante. `;
        contextContent += `Villa Petriolo si trova a Figline Valdarno, circa 30 km da Firenze. La struttura offre un ristorante gourmet, spa, piscina e varie attività.\n\n`;
        
        return contextContent;
    }
    
    /**
     * Gets context with all general info
     * @returns {string} - Complete context
     */
    getGeneralContext() {
        // Import JSON data
        const restaurantData = require('../../data/ristorante.json');
        const attivitaData = require('../../data/attivita.json');
        const eventiData = require('../../data/eventi.json');
        const serviziData = require('../../data/servizi.json');
        
        // Get basic info from each data source
        const orari = restaurantData?.orari || {};
        const attivitaStruttura = attivitaData?.nella_struttura || [];
        const serviziHotel = serviziData?.servizi_hotel || [];
        
        let generalInfo = `INFORMAZIONI GENERALI SU VILLA PETRIOLO:\n`;
        
        // Restaurant info
        generalInfo += `- Ristorante: aperto tutti i giorni, pranzo 12:30-14:30, cena 19:30-22:30\n`;
        generalInfo += `- Prenotazioni: interno 122 o ristorante@villapetriolo.com\n`;
        
        // Menu info (basic)
        generalInfo += `- Il ristorante offre cucina toscana con prodotti biologici e a km zero\n`;
        
        // Activities info
        if (attivitaStruttura.length > 0) {
            generalInfo += `- Attività: degustazioni di vino, corsi di cucina, yoga, escursioni guidate\n`;
        }
        
        // Services info
        generalInfo += `- Servizi: Wi-Fi gratuito, piscina, spa e centro benessere, parcheggio, servizio in camera\n`;
        
        // Area info
        generalInfo += `- Nei dintorni: Firenze (30km), Arezzo (40km), Siena (50km)\n`;
        generalInfo += `- Attrazioni locali: degustazioni di vino, borghi medievali, passeggiate nel Chianti\n`;
        
        return generalInfo + '\n';
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