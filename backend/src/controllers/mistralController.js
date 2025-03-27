// backend/src/controllers/mistralController.js
const mistralService = require('../services/mistralService');
const { v4: uuidv4 } = require('uuid');

// Set DEBUG to true for detailed logging
const DEBUG = true;

class MistralController {
    // Process chat messages
    async chat(req, res) {
        const sessionId = req.headers['x-session-id'] || req.body.sessionId || uuidv4();
        const userId = req.headers['x-user-id'] || req.body.userId || null;
        
        try {
            if (DEBUG) {
                console.log(`Chat request received for session ${sessionId}`);
                if (userId) console.log(`Authenticated user: ${userId}`);
                console.log('Headers:', JSON.stringify(req.headers));
                console.log('Body:', JSON.stringify(req.body));
            }
            
            const { message } = req.body;
    
            if (!message) {
                console.log('Message is missing in request');
                return res.status(400).json({ 
                    error: 'Message is required',
                    message: 'Per favore inserisci un messaggio.',
                    sessionId
                });
            }
    
            if (DEBUG) console.log(`Processing message: "${message}" for session ${sessionId}`);
            
            // Passa l'userId opzionale al servizio
            const response = await mistralService.processMessage(message, sessionId, userId);
            if (DEBUG) console.log(`Response generated for session ${sessionId}`);
            
            // Aggiungi informazioni sull'autenticazione nella risposta
            if (userId) {
                response.authenticated = true;
                // Non inviare l'userId nella risposta per sicurezza
            } else {
                response.authenticated = false;
            }
            
            return res.json(response);
        } catch (error) {
            console.error(`Error in chat endpoint for session ${sessionId}:`, error);
            
            // Return an error response that won't break the client
            return res.json({
                error: 'Error processing message',
                message: "Mi dispiace, si è verificato un errore. Potrebbe riprovare più tardi?",
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

            if (DEBUG) console.log(`Clearing history for session ${sessionId}`);
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
        const userId = req.headers['x-user-id'] || req.body.userId || null;
        
        try {
            if (DEBUG) {
                console.log(`Initializing new session ${sessionId}`);
                if (userId) console.log(`For authenticated user: ${userId}`);
            }
            
            await mistralService.initializeConversation(sessionId);
            
            const response = { 
                sessionId, 
                message: 'Session initialized successfully'
            };
            
            // Aggiungi informazioni sull'autenticazione
            if (userId) {
                response.authenticated = true;
                // Non inviare l'userId nella risposta per sicurezza
            } else {
                response.authenticated = false;
            }
            
            return res.json(response);
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