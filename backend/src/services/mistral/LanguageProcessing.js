// src/services/mistral/LanguageProcessing.js

/**
 * Language detection and processing utility functions
 */
class LanguageProcessing {
    constructor(languageDetector, linguisticPatch) {
        this.languageDetector = languageDetector;
        this.linguisticPatch = linguisticPatch;
    }

    /**
     * Performs language detection and analysis
     * @param {string} message - The message to analyze
     * @returns {string} - The detected language code
     */
    detectLanguage(message) {
        console.log(`\n====== ANALYZING USER MESSAGE ======`);  
        console.log(`[LanguageProcessing] User message: "${message}"`);          
        
        // Extract Cyrillic characters for debug verification
        let cyrillicChars = message.match(/[\u0400-\u04FF]/g) || [];
        console.log(`[LanguageProcessing] Cyrillic characters in message: ${cyrillicChars.length}`);
        if (cyrillicChars.length > 0) {
            console.log(`[LanguageProcessing] Cyrillic characters: "${cyrillicChars.join('')}"`); 
        }
        
        // Use the linguistic patcher to check if it's Russian
        const russianAnalysis = this.linguisticPatch.forceRussianDetection(message);
        console.log(`[LanguageProcessing] Russian analysis: ${JSON.stringify(russianAnalysis)}`);
        
        // If it's Russian, force the language setting
        let detectedLanguage;
        if (russianAnalysis.isRussian) {
            detectedLanguage = 'ru';
            console.log(`[LanguageProcessing] FORCED DETECTION: RUSSIAN (due to Cyrillic characters)`);  
        } else {
            // Otherwise use normal language detection
            detectedLanguage = this.languageDetector.detect(message);
        }
        
        console.log(`[LanguageProcessing] *********** DETECTED LANGUAGE: ${detectedLanguage} ***********`);
        console.log('====== END OF USER MESSAGE ANALYSIS ======\n');
        
        return detectedLanguage;
    }

    /**
     * Checks if the message is a simple greeting
     * @param {string} message - Message to check
     * @returns {boolean} - True if it's a simple greeting
     */
    isSimpleGreeting(message) {
        return message.toLowerCase().trim().match(/^(ciao|salve|buongiorno|buonasera|hi|hello|hey)$/);
    }

    /**
     * Check if the message is in Russian
     * @param {string} message - Message to check
     * @returns {boolean} - True if the message is in Russian
     */
    isRussian(message) {
        const russianAnalysis = this.linguisticPatch.forceRussianDetection(message);
        return russianAnalysis.isRussian;
    }

    /**
     * Analyzes the response language and ensures it matches the expected language
     * @param {string} response - AI response to analyze
     * @param {string} detectedLanguage - Expected language
     * @returns {boolean} - True if the response is in the correct language
     */
    isResponseInCorrectLanguage(response, detectedLanguage) {
        return this.linguisticPatch.isResponseInCorrectLanguage(response, detectedLanguage);
    }

    /**
     * Detects the topic of the message for better context preparation
     * @param {string} message - User message
     * @returns {string} - Detected topic (menu, attivita, eventi, servizi, or null)
     */
    detectMessageTopic(message) {
        const lowerMsg = message.toLowerCase();
        
        // Restaurant/menu related
        if (lowerMsg.includes('ristorante') || lowerMsg.includes('menu') || 
            lowerMsg.includes('mangiare') || lowerMsg.includes('pranzo') || 
            lowerMsg.includes('cena') || lowerMsg.includes('colazione')) {
            return 'menu';
        }
        
        // Activities related
        if (lowerMsg.includes('attività') || lowerMsg.includes('fare') || 
            lowerMsg.includes('tour') || lowerMsg.includes('escursion') || 
            lowerMsg.includes('visita')) {
            return 'attivita';
        }
        
        // Events related
        if (lowerMsg.includes('eventi') || lowerMsg.includes('programma') || 
            lowerMsg.includes('concerto') || lowerMsg.includes('spettacolo') || 
            lowerMsg.includes('cosa c\'è')) {
            return 'eventi';
        }
        
        // Services related
        if (lowerMsg.includes('servizi') || lowerMsg.includes('spa') || 
            lowerMsg.includes('wifi') || lowerMsg.includes('parcheggio') || 
            lowerMsg.includes('navetta')) {
            return 'servizi';
        }
        
        // No specific topic detected
        return null;
    }
}

module.exports = LanguageProcessing;