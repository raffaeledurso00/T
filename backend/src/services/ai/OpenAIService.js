// src/services/ai/OpenAIService.js
const OpenAI = require('openai');
const OPENAI_CONFIG = require('../../config/openaiConfig');
const { redisClient } = require('../../config/database');
const mongoose = require('mongoose');

// Assicurati che tutti i modelli necessari siano importati
let VillaInfo, Service, Booking;
try {
    VillaInfo = mongoose.model('VillaInfo');
    Service = mongoose.model('Service');
    Booking = mongoose.model('Booking');
} catch (error) {
    // Se i modelli non sono ancora stati registrati, caricali
    try {
        VillaInfo = require('../../models/VillaInfo');
        Service = require('../../models/Service');
        Booking = require('../../models/Booking');
    } catch (modelError) {
        console.error('Failed to load models:', modelError);
    }
}

class OpenAIService {
    constructor() {
        // Verifica che la chiave API sia disponibile
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY not set in environment variables!');
        }
        
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Map per memorizzare gli ultimi timestamp di attività per ogni conversazione
        this.conversationTimestamps = new Map();
        
        // Pianifica la pulizia periodica della cache delle conversazioni
        setInterval(() => this.cleanupOldConversations(), 3600000); // Ogni ora
    }

    async initializeConversation(sessionId) {
        const messages = [{
            role: "system",
            content: OPENAI_CONFIG.system_prompt
        }];
        
        // Memorizziamo la conversazione in Redis con una scadenza di 24 ore
        await redisClient.set(
            `conversation:${sessionId}`,
            JSON.stringify(messages),
            'EX',
            86400 // 24 ore
        );
        
        // Aggiorna il timestamp
        this.conversationTimestamps.set(sessionId, Date.now());
        
        return messages;
    }

    async getConversationHistory(sessionId) {
        try {
            const history = await redisClient.get(`conversation:${sessionId}`);
            
            if (history) {
                // Aggiorna il timestamp di attività
                this.conversationTimestamps.set(sessionId, Date.now());
                return JSON.parse(history);
            } else {
                return await this.initializeConversation(sessionId);
            }
        } catch (error) {
            console.error('Error retrieving conversation history:', error);
            // In caso di errore, inizializza una nuova conversazione
            return await this.initializeConversation(sessionId);
        }
    }

    async updateConversationHistory(sessionId, messages) {
        try {
            // Aggiorna la conversazione in Redis con una scadenza di 24 ore
            await redisClient.set(
                `conversation:${sessionId}`,
                JSON.stringify(messages),
                'EX',
                86400 // 24 ore
            );
            
            // Aggiorna il timestamp di attività
            this.conversationTimestamps.set(sessionId, Date.now());
        } catch (error) {
            console.error('Error updating conversation history:', error);
            throw error;
        }
    }

    async getBookingInfo(bookingId) {
        try {
            return await Booking.findById(bookingId);
        } catch (error) {
            console.error('Error retrieving booking information:', error);
            return null;
        }
    }

    async getVillaInfo() {
        try {
            return await VillaInfo.findOne();
        } catch (error) {
            console.error('Error retrieving villa information:', error);
            return null;
        }
    }

    async getAvailableServices() {
        try {
            return await Service.find({ available: true });
        } catch (error) {
            console.error('Error retrieving available services:', error);
            return [];
        }
    }

    async processMessage(sessionId, userMessage) {
        try {
            let messages = await this.getConversationHistory(sessionId);
            
            // Add user message to conversation
            messages.push({
                role: "user",
                content: userMessage
            });

            // Get relevant context from database
            const villaInfo = await this.getVillaInfo();
            const availableServices = await this.getAvailableServices();
            
            // Create context message
            let contextContent = 'Rispondi come assistente di Villa Petriolo.';
            
            if (villaInfo) {
                contextContent += `\nInformazioni attuali sulla villa: ${JSON.stringify(villaInfo)}.`;
            }
            
            if (availableServices && availableServices.length > 0) {
                contextContent += `\nServizi disponibili: ${JSON.stringify(availableServices)}.`;
            }
            
            const contextMessage = {
                role: "system",
                content: contextContent
            };
            
            // Inserisci o aggiorna il messaggio di contesto
            let contextIndex = messages.findIndex(msg => msg.role === "system");
            if (contextIndex !== -1) {
                messages[contextIndex] = contextMessage;
            } else {
                messages.unshift(contextMessage);
            }

            // Limita la dimensione della conversazione per evitare di superare i limiti del contesto
            // Mantieni il messaggio di sistema e gli ultimi N messaggi
            const MAX_CONTEXT_MESSAGES = 10;
            if (messages.length > MAX_CONTEXT_MESSAGES + 1) { // +1 per il messaggio di sistema
                const systemMessage = messages[0];
                messages = [systemMessage, ...messages.slice(messages.length - MAX_CONTEXT_MESSAGES)];
            }

            // Get response from OpenAI
            const completion = await this.openai.chat.completions.create({
                model: OPENAI_CONFIG.model,
                messages: messages,
                temperature: OPENAI_CONFIG.temperature,
                max_tokens: OPENAI_CONFIG.max_tokens,
                presence_penalty: OPENAI_CONFIG.presence_penalty,
                frequency_penalty: OPENAI_CONFIG.frequency_penalty
            });

            const assistantMessage = completion.choices[0].message;
            messages.push(assistantMessage);

            // Update conversation history
            await this.updateConversationHistory(sessionId, messages);

            return assistantMessage.content;
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }

    async cleanupOldConversations() {
        try {
            // Rimuovi conversazioni inattive da più di 24 ore
            const now = Date.now();
            const keysToDelete = [];
            
            for (const [sessionId, timestamp] of this.conversationTimestamps.entries()) {
                if (now - timestamp > 86400000) { // 24 ore in millisecondi
                    keysToDelete.push(`conversation:${sessionId}`);
                    this.conversationTimestamps.delete(sessionId);
                }
            }
            
            // Elimina le chiavi da Redis
            if (keysToDelete.length > 0) {
                await redisClient.del(...keysToDelete);
                console.log(`Cleaned up ${keysToDelete.length} old conversations`);
            }
        } catch (error) {
            console.error('Error cleaning up old conversations:', error);
        }
    }
}

module.exports = process.env.OPENAI_API_KEY ? new OpenAIService() : null;
