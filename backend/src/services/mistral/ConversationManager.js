// src/services/mistral/ConversationManager.js
const { redisClient, isRedisFallbackMode } = require('../../config/database');

// Set DEBUG to true for detailed logging
const DEBUG = false;

class ConversationManager {
    constructor() {
        this.conversationHistory = new Map(); // In-memory fallback
    }

    async initializeConversation(sessionId) {
        try {
            if (DEBUG) console.log(`Initializing conversation for session ${sessionId}`);
            
            // Istruisci il modello con prompt più specifico
            const systemMessage = {
                role: 'system',
                content: 'Sei l\'assistente virtuale di Villa Petriolo, un\'esclusiva villa di lusso in Toscana. ' +
                         'Aiuta gli ospiti con informazioni sulla villa, prenotazioni, e servizi disponibili. ' +
                         
                         // Linee guida specifiche per i saluti
                         'Per saluti come "ciao", "buongiorno", "salve", ecc., rispondi con un messaggio breve e amichevole di massimo 1-2 frasi. ' +
                         'Evita risposte lunghe e formali a saluti semplici. ' +
                         
                         // Linee guida per il menu con prezzi
                         'Quando fornisci informazioni sul menu o sul ristorante, includi SEMPRE i prezzi per ogni piatto (es: €15, €22, ecc). ' +
                         
                         // Linee guida per formattazione specifica
                         'IMPORTANTE: SOLO quando l\'utente chiede informazioni specifiche usa la formattazione speciale: ' +
                         '- Per menu/ristorante: usa le sezioni "ANTIPASTI:", "PRIMI:", "SECONDI:", "DOLCI:" includendo sempre il prezzo per ogni piatto. ' +
                         '- Per attività: usa le sezioni "INTERNE:", "ESTERNE:", "ESCURSIONI:" includendo sempre costi e durata. ' +
                         '- Per eventi: usa le sezioni "SPECIALI:", "SETTIMANALI:", "STAGIONALI:" includendo sempre date e costi. ' +
                         
                         // Mantenere risposte in ambito
                         'Per domande generali, rispondi in modo naturale e conciso senza usare formattazioni speciali.'
            };
            
            // Initialize conversation history
            const messages = [systemMessage];
            
            // Store in memory or Redis based on configuration
            if (isRedisFallbackMode) {
                this.conversationHistory.set(sessionId, messages);
            } else {
                try {
                    await redisClient.set(
                        `chat:${sessionId}`,
                        JSON.stringify(messages),
                        'EX',
                        86400 // 24 hours
                    );
                } catch (redisError) {
                    console.error('Redis error during initialization, using in-memory storage:', redisError);
                    this.conversationHistory.set(sessionId, messages);
                }
            }
            
            if (DEBUG) console.log(`Conversation initialized for session ${sessionId}`);
            return true;
        } catch (error) {
            console.error('Error initializing conversation:', error);
            throw error;
        }
    }

    async getConversationHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Getting conversation history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                // In-memory storage mode
                if (!this.conversationHistory.has(sessionId)) {
                    if (DEBUG) console.log(`No history found for ${sessionId}, initializing new conversation`);
                    await this.initializeConversation(sessionId);
                }
                return this.conversationHistory.get(sessionId);
            } else {
                try {
                    // Try Redis first
                    const history = await redisClient.get(`chat:${sessionId}`);
                    
                    if (history) {
                        if (DEBUG) console.log(`Found history in Redis for ${sessionId}`);
                        return JSON.parse(history);
                    } else {
                        if (DEBUG) console.log(`No history in Redis for ${sessionId}, initializing`);
                        await this.initializeConversation(sessionId);
                        return await this.getConversationHistory(sessionId);
                    }
                } catch (redisError) {
                    console.error('Redis error, falling back to in-memory:', redisError);
                    if (!this.conversationHistory.has(sessionId)) {
                        await this.initializeConversation(sessionId);
                    }
                    return this.conversationHistory.get(sessionId);
                }
            }
        } catch (error) {
            console.error(`Error retrieving conversation history for ${sessionId}:`, error);
            // Create a new conversation in case of error
            await this.initializeConversation(sessionId);
            return this.conversationHistory.get(sessionId) || [];
        }
    }

    async updateConversationHistory(sessionId, messages) {
        try {
            if (DEBUG) console.log(`Updating conversation history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                this.conversationHistory.set(sessionId, messages);
            } else {
                try {
                    await redisClient.set(
                        `chat:${sessionId}`,
                        JSON.stringify(messages),
                        'EX',
                        86400 // 24 hours
                    );
                } catch (redisError) {
                    console.error('Redis error when updating history, using in-memory:', redisError);
                    this.conversationHistory.set(sessionId, messages);
                }
            }
        } catch (error) {
            console.error(`Error updating conversation history for ${sessionId}:`, error);
            throw error;
        }
    }

    async clearHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Clearing history for session ${sessionId}`);
            
            if (isRedisFallbackMode) {
                this.conversationHistory.delete(sessionId);
            } else {
                try {
                    await redisClient.del(`chat:${sessionId}`);
                } catch (redisError) {
                    console.error('Redis error when clearing history:', redisError);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error clearing history for ${sessionId}:`, error);
            throw error;
        }
    }
}

module.exports = ConversationManager;