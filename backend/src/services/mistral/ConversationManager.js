// src/services/mistral/ConversationManager.js
const { redisClient, isRedisFallbackMode } = require('../../config/database');

// Set DEBUG to true for detailed logging
const DEBUG = false;

class ConversationManager {
    constructor() {
        this.conversationHistory = new Map(); // In-memory fallback
        this.lastAccessTime = new Map(); // Track when each conversation was last accessed
        
        // Set up periodic cleanup for in-memory cache
        setInterval(() => this.cleanupOldConversations(), 3600000); // Cleanup every hour
    }

    async initializeConversation(sessionId) {
        try {
            if (DEBUG) console.log(`Initializing conversation for session ${sessionId}`);
            
            // Create a more specific system prompt
            const systemMessage = {
                role: 'system',
                content: 'Sei il concierge virtuale di Villa Petriolo, un\'esclusiva villa di lusso in Toscana. ' +
                         'Aiuta gli ospiti con informazioni sulla villa, prenotazioni, e servizi disponibili. ' +
                         
                         // Guidelines for greetings
                         'Per saluti come "ciao", "buongiorno", "salve", ecc., rispondi con un messaggio breve e amichevole di massimo 1-2 frasi. ' +
                         'Evita risposte lunghe e formali a saluti semplici. ' +
                         
                         // Guidelines for menu with prices
                         'Quando fornisci informazioni sul menu o sul ristorante, includi SEMPRE i prezzi per ogni piatto (es: €15, €22, ecc). ' +
                         
                         // Guidelines for specific formatting
                         'IMPORTANTE: SOLO quando l\'utente chiede informazioni specifiche usa la formattazione speciale: ' +
                         '- Per menu/ristorante: usa le sezioni "ANTIPASTI:", "PRIMI:", "SECONDI:", "DOLCI:" includendo sempre il prezzo per ogni piatto. ' +
                         '- Per attività: usa le sezioni "INTERNE:", "ESTERNE:", "ESCURSIONI:" includendo sempre costi e durata. ' +
                         '- Per eventi: usa le sezioni "SPECIALI:", "SETTIMANALI:", "STAGIONALI:" includendo sempre date e costi. ' +
                         
                         // Keep responses on topic
                         'Per domande generali, rispondi in modo naturale e conciso senza usare formattazioni speciali.'
            };
            
            // Initialize conversation history
            const messages = [systemMessage];
            
            // Store in memory or Redis based on configuration
            if (isRedisFallbackMode) {
                this.conversationHistory.set(sessionId, messages);
                this.lastAccessTime.set(sessionId, Date.now());
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
                    this.lastAccessTime.set(sessionId, Date.now());
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
                // Update last access time
                this.lastAccessTime.set(sessionId, Date.now());
                return this.conversationHistory.get(sessionId);
            } else {
                try {
                    // Try Redis first
                    const history = await redisClient.get(`chat:${sessionId}`);
                    
                    if (history) {
                        if (DEBUG) console.log(`Found history in Redis for ${sessionId}`);
                        // Reset expiration time
                        await redisClient.expire(`chat:${sessionId}`, 86400); // 24 hours
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
                    // Update last access time
                    this.lastAccessTime.set(sessionId, Date.now());
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
                this.lastAccessTime.set(sessionId, Date.now());
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
                    this.lastAccessTime.set(sessionId, Date.now());
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
                this.lastAccessTime.delete(sessionId);
            } else {
                try {
                    await redisClient.del(`chat:${sessionId}`);
                } catch (redisError) {
                    console.error('Redis error when clearing history:', redisError);
                    // Also remove from in-memory backup if exists
                    this.conversationHistory.delete(sessionId);
                    this.lastAccessTime.delete(sessionId);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error clearing history for ${sessionId}:`, error);
            throw error;
        }
    }
    
    // Cleanup old conversations to prevent memory leaks
    cleanupOldConversations() {
        try {
            const now = Date.now();
            const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            if (this.conversationHistory.size === 0) return;
            
            if (DEBUG) console.log(`Cleaning up in-memory conversation cache. Current size: ${this.conversationHistory.size}`);
            
            // Remove conversations that haven't been accessed in 24 hours
            for (const [sessionId, lastAccess] of this.lastAccessTime.entries()) {
                if (now - lastAccess > EXPIRY_TIME) {
                    this.conversationHistory.delete(sessionId);
                    this.lastAccessTime.delete(sessionId);
                    if (DEBUG) console.log(`Removed expired conversation: ${sessionId}`);
                }
            }
            
            // If we still have too many conversations, remove the oldest ones
            if (this.conversationHistory.size > 100) {
                // Sort sessions by access time (oldest first)
                const sortedSessions = Array.from(this.lastAccessTime.entries())
                    .sort((a, b) => a[1] - b[1]);
                
                // Remove about 20% of the oldest conversations
                const toRemove = Math.ceil(this.conversationHistory.size * 0.2);
                for (let i = 0; i < toRemove && i < sortedSessions.length; i++) {
                    const sessionId = sortedSessions[i][0];
                    this.conversationHistory.delete(sessionId);
                    this.lastAccessTime.delete(sessionId);
                    if (DEBUG) console.log(`Removed old conversation: ${sessionId}`);
                }
                
                if (DEBUG) console.log(`Removed ${toRemove} old conversations from memory cache`);
            }
            
            if (DEBUG) console.log(`Cleanup complete. New cache size: ${this.conversationHistory.size}`);
        } catch (error) {
            console.error('Error cleaning up conversations:', error);
        }
    }
}

module.exports = ConversationManager;