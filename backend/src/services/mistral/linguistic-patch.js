// src/services/mistral/linguistic-patch.js
// Main entrypoint for linguistic patching - now forwards to modular implementation

// Import modular implementation
const linguisticPatcher = require('./linguistic-patch/index');

/**
 * Apply the multilingual patch to a service
 * @param {Object} service - The service to patch
 */
function applyMultilingualPatch(service) {
    return linguisticPatcher.applyMultilingualPatch(service);
}

// Export the original functions for backward compatibility
module.exports = {
    applyMultilingualPatch,
    
    // Forward other functions to modular implementation
    forceRussianDetection: linguisticPatcher.forceRussianDetection.bind(linguisticPatcher),
    isResponseInCorrectLanguage: linguisticPatcher.isResponseInCorrectLanguage.bind(linguisticPatcher),
    getRussianFallbackResponse: linguisticPatcher.getRussianFallbackResponse.bind(linguisticPatcher),
    translateWithFallback: linguisticPatcher.translateWithFallback.bind(linguisticPatcher),
    patchLanguageDetection: linguisticPatcher.patchLanguageDetection.bind(linguisticPatcher)
};