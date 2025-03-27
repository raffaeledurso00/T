const express = require('express');
const router = express.Router();
const openAIService = require('../services/ai/OpenAIService');

// Initialize a new chat session
router.post('/init', async (req, res) => {
    try {
        const sessionId = Date.now().toString();
        await openAIService.initializeConversation(sessionId);
        res.json({ sessionId });
    } catch (error) {
        console.error('Error initializing chat:', error);
        res.status(500).json({ error: 'Failed to initialize chat session' });
    }
});

// Process a message
router.post('/message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'Session ID and message are required' });
        }

        const response = await openAIService.processMessage(sessionId, message);
        res.json({ response });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Get conversation history
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await openAIService.getConversationHistory(sessionId);
        res.json({ history });
    } catch (error) {
        console.error('Error retrieving conversation history:', error);
        res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
});

module.exports = router;
