// backend/src/controllers/mistralController.js
const mistralService = require('../services/mistralService');
const { v4: uuidv4 } = require('uuid');

class MistralController {
    // Process chat messages
    async chat(req, res) {
        const sessionId = req.headers['x-session-id'] || req.body.sessionId || uuidv4();
        
        try {
            console.log(`Chat request received for session ${sessionId}`);
            
            const { message } = req.body;
    
            if (!message) {
                console.log('Message is missing in request');
                return res.status(400).json({ 
                    error: 'Message is required',
                    message: 'Per favore inserisci un messaggio.',
                    sessionId
                });
            }
    
            console.log(`Processing message: "${message}" for session ${sessionId}`);
            
            const response = await mistralService.processMessage(message, sessionId);
            console.log(`Response generated for session ${sessionId}`);
            
            return res.json(response);
        } catch (error) {
            console.error(`Error in chat endpoint for session ${sessionId}:`, error);
            
            // Return the error to the client
            return res.status(500).json({
                error: 'Error processing message',
                details: error.message,
                sessionId: sessionId
            });
        }
    }

    // Clear chat history
    async clearHistory(req, res) {
        const sessionId = req.headers['x-session-id'] || req.body.sessionId;
        
        try {
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }

            console.log(`Clearing history for session ${sessionId}`);
            const result = await mistralService.clearHistory(sessionId);
            return res.json(result);
        } catch (error) {
            console.error(`Error clearing chat history for session ${sessionId}:`, error);
            return res.status(500).json({ 
                error: 'Error clearing history', 
                details: error.message,
                sessionId
            });
        }
    }
    
    // Initialize a new session
    async initSession(req, res) {
        const sessionId = uuidv4();
        
        try {
            console.log(`Initializing new session ${sessionId}`);
            await mistralService.initializeConversation(sessionId);
            return res.json({ 
                sessionId, 
                message: 'Session initialized successfully'
            });
        } catch (error) {
            console.error(`Error initializing session ${sessionId}:`, error);
            return res.status(500).json({ 
                error: 'Error initializing session', 
                details: error.message,
                sessionId
            });
        }
    }
}

module.exports = new MistralController();