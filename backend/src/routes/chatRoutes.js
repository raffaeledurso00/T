const express = require('express');
const router = express.Router();

// Importiamo i servizi in modo sicuro
let mistralService, openAIService;
try {
    mistralService = require('../services/ai/MistralService');
} catch (error) {
    console.warn('MistralService not available:', error.message);
}

try {
    openAIService = require('../services/ai/OpenAIService');
} catch (error) {
    console.warn('OpenAIService not available:', error.message);
}

// Usa un servizio mock se nessun servizio AI è disponibile
const mockService = {
    async initializeConversation(sessionId) {
        console.log(`Mock: Initializing conversation ${sessionId}`);
        return [{ role: 'system', content: 'This is a mock AI service.' }];
    },
    async processMessage(sessionId, message) {
        console.log(`Mock: Processing message for ${sessionId}: ${message}`);
        return `Echo: ${message}\n\nNota: Questo è un servizio AI simulato perché il servizio principale non è disponibile.`;
    },
    async getConversationHistory(sessionId) {
        return [{ role: 'system', content: 'This is a mock AI service.' }];
    },
    cleanupOldConversations() {}
};

// Usa Mistral se disponibile, altrimenti OpenAI, altrimenti mockService
const aiService = mistralService || openAIService || mockService;
console.log(`Using AI service: ${mistralService ? 'Mistral' : openAIService ? 'OpenAI' : 'Mock'}`);

// Initialize a new chat session
router.post('/init', async (req, res) => {
    try {
        const sessionId = Date.now().toString();
        await aiService.initializeConversation(sessionId);
        res.json({ sessionId });
    } catch (error) {
        console.error('Error initializing chat:', error);
        res.status(500).json({ error: 'Failed to initialize chat session' });
    }
});

// Process a message
router.post('/message', async (req, res) => {
    try {
        const { message } = req.body;
        const sessionId = req.headers['x-session-id'] || Date.now().toString();
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`Processing message for session ${sessionId}: ${message.substring(0, 50)}...`);

        const response = await aiService.processMessage(sessionId, message);
        
        // Format response to match frontend expectations
        res.json({
            message: response,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await aiService.getConversationHistory(sessionId);
        res.json({ history });
    } catch (error) {
        console.error('Error retrieving conversation history:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
});

module.exports = router;
