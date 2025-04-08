// src/services/mistral/index.js
const MistralService = require('./MistralService');
const knowledgeBaseService = require('../knowledgeBase');

// Initialize knowledge base if not already done
if (!knowledgeBaseService.initialized) {
    console.log('[MistralService] Initializing KnowledgeBase...');
    knowledgeBaseService.initialize().catch(err => {
        console.error('[MistralService] Error initializing KnowledgeBase:', err);
    });
}

// Export a singleton instance of the service
module.exports = new MistralService();