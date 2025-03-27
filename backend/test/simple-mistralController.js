// simple-mistralController.js
const simpleMistralService = require('./simple-mistralService');
const { v4: uuidv4 } = require('uuid');

class SimpleMistralController {
    async chat(req, res) {
        try {
            console.log('Chat request received:', {
                headers: req.headers,
                body: req.body
            });
            
            const { message } = req.body;
            const sessionId = req.headers['x-session-id'] || req.body.sessionId || uuidv4();
    
            if (!message) {
                console.log('Message is missing in request');
                return res.status(400).json({ 
                    error: 'Message is required',
                    message: 'Per favore inserisci un messaggio.'
                });
            }
    
            console.log(`Processing message: "${message}" for session ${sessionId}`);
            
            try {
                const response = await simpleMistralService.processMessage(message, sessionId);
                console.log(`Response generated for session ${sessionId}:`, response);
                res.json(response);
            } catch (serviceError) {
                console.error('Error in simpleMistralService.processMessage:', serviceError);
                res.json({
                    message: "Mi dispiace, si è verificato un errore nell'elaborazione della tua richiesta. Riprova più tardi.",
                    sessionId: sessionId,
                    error: true
                });
            }
        } catch (error) {
            console.error('Uncaught error in chat endpoint:', error);
            res.status(500).json({ 
                error: 'Internal server error', 
                message: 'Si è verificato un errore. Riprova più tardi.',
                details: error.message
            });
        }
    }

    async clearHistory(req, res) {
        try {
            const sessionId = req.headers['x-session-id'] || req.body.sessionId;
            
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }

            const result = await simpleMistralService.clearHistory(sessionId);
            res.json(result);
        } catch (error) {
            console.error('Error clearing chat history:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
    
    async initSession(req, res) {
        try {
            const sessionId = uuidv4();
            const result = await simpleMistralService.initSession(sessionId);
            res.json(result);
        } catch (error) {
            console.error('Error initializing session:', error);
            res.status(500).json({ error: 'Failed to initialize session', details: error.message });
        }
    }
}

module.exports = new SimpleMistralController();