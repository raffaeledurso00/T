// src/services/mistral/linguistic-patch/LanguageVerifier.js

/**
 * Class for verifying and validating language of responses
 */
class LanguageVerifier {
    constructor() {
        this.cyrillicRegex = /[\u0400-\u04FF]/;
        
        // Language-specific verification settings
        this.languageSettings = {
            ru: {
                minRatio: 0.15,  // At least 15% Cyrillic characters for Russian
                checker: (text) => this.checkRussianText(text)
            }
            // Add other language verifiers as needed
        };
    }
    
    /**
     * Count Cyrillic characters in text
     * @param {string} text - Text to analyze
     * @returns {number} - Number of Cyrillic characters
     */
    countCyrillicChars(text) {
        if (!text) return 0;
        return (text.match(this.cyrillicRegex) || []).length;
    }
    
    /**
     * Check if text is in Russian 
     * @param {string} text - Text to analyze
     * @returns {object} - Analysis result
     */
    checkRussianText(text) {
        const cyrillicCount = this.countCyrillicChars(text);
        const totalChars = text.replace(/\s+/g, '').length;
        const cyrillicRatio = totalChars > 0 ? cyrillicCount / totalChars : 0;
        
        return { 
            isRussian: cyrillicRatio >= this.languageSettings.ru.minRatio,
            cyrillicRatio
        };
    }
    
    /**
     * Checks if a response is in the correct language
     * @param {string} response - Response to check
     * @param {string} targetLanguage - Target language code
     * @returns {boolean} - True if in correct language
     */
    isResponseInCorrectLanguage(response, targetLanguage) {
        if (!response || !targetLanguage) return false;
        
        // For Russian, check presence of Cyrillic characters
        if (targetLanguage === 'ru') {
            const russianCheck = this.checkRussianText(response);
            return russianCheck.isRussian;
        }
        
        // For other languages, we could add more verification logic
        // For now, default to true for other languages
        return true;
    }
}

module.exports = LanguageVerifier;