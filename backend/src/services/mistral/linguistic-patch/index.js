// src/services/mistral/linguistic-patch/index.js

const CyrillicDetector = require('./CyrillicDetector');
const LanguageVerifier = require('./LanguageVerifier');
const ResponseFallbacks = require('./ResponseFallbacks');
const TranslationUtils = require('./TranslationUtils');

/**
 * Main linguistic patcher class that combines all linguistic utilities
 */
class LinguisticPatcher {
    constructor() {
        this.cyrillicDetector = new CyrillicDetector();
        this.languageVerifier = new LanguageVerifier();
        this.responseFallbacks = new ResponseFallbacks();
        this.translationUtils = new TranslationUtils();
    }

    /**
     * Force Russian detection if there are Cyrillic characters
     * @param {string} text - Text to analyze
     * @returns {object} - Analysis result
     */
    forceRussianDetection(text) {
        return this.cyrillicDetector.forceRussianDetection(text);
    }

    /**
     * Checks if a response is in the correct language
     * @param {string} response - Response to verify
     * @param {string} targetLanguage - Target language
     * @returns {boolean} - True if response is in correct language
     */
    isResponseInCorrectLanguage(response, targetLanguage) {
        return this.languageVerifier.isResponseInCorrectLanguage(response, targetLanguage);
    }

    /**
     * Gets a Russian fallback response
     * @returns {string} - Russian response
     */
    getRussianFallbackResponse() {
        return this.responseFallbacks.getRussianResponse();
    }

    /**
     * Translates with fallback mechanisms
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language
     * @returns {string} - Translated text
     */
    async translateWithFallback(text, targetLanguage) {
        return await this.translationUtils.translateWithFallback(text, targetLanguage);
    }

    /**
     * Patch for language detection
     * @param {string} text - Text to analyze
     * @param {function} detectFn - Original detection function
     * @returns {string} - Detected language code
     */
    patchLanguageDetection(text, detectFn) {
        // Check for Cyrillic characters first
        const russianAnalysis = this.forceRussianDetection(text);
        
        // If there are enough Cyrillic characters, force Russian
        if (russianAnalysis.forceDetection) {
            return 'ru';
        }
        
        // Otherwise, proceed with normal detection
        return detectFn(text);
    }
    
    /**
     * Apply multilingual patch to a service
     * @param {Object} service - Service to patch
     */
    applyMultilingualPatch(service) {
        if (!service) return;
        
        // Add linguistic patch methods to the service if needed
        service.linguisticPatcher = this;
        
        console.log('[LinguisticPatcher] Successfully applied linguistic patch');
    }
}

// Export singleton instance
module.exports = new LinguisticPatcher();