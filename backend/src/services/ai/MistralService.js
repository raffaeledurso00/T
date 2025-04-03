// src/services/ai/MistralService.js
// Modifica l'importazione per gestire moduli ES
let MistralClient;

// Supporta sia ESM che CommonJS
async function initMistral() {
  try {
    // Prova a importare dinamicamente (supporta ESM)
    const module = await import('@mistralai/mistralai');
    MistralClient = module.default;
    console.log('Mistral AI client importato con successo');
    return true;
  } catch (error) {
    console.error('Errore nell\'importazione di Mistral AI:', error);
    return false;
  }
}

// Avvia l'importazione
initMistral();
const { redisClient } = require('../../config/database');
const mongoose = require('mongoose');

// Make sure all required models are imported
let VillaInfo, Service, Booking;
try {
    VillaInfo = mongoose.model('VillaInfo');
    Service = mongoose.model('Service');
    Booking = mongoose.model('Booking');
} catch (error) {
    // If models aren't registered yet, load them
    try {
        VillaInfo = require('../../models/VillaInfo');
        Service = require('../../models/Service');
        Booking = require('../../models/Booking');
    } catch (modelError) {
        console.error('Failed to load models:', modelError);
    }
}

class MistralService {
  constructor() {
    // Verifica che la chiave API sia disponibile
    if (!process.env.MISTRAL_API_KEY) {
      console.warn('MISTRAL_API_KEY not set in environment variables!');
    }
    
    // L'istanza client verrà inizializzata in modo asincrono dopo il caricamento del modulo
    this.client = null;
    this.isInitialized = false;
    
    // Inizializza il client quando il modulo è pronto
    initMistral().then(success => {
      if (success && MistralClient) {
        try {
          this.client = new MistralClient(process.env.MISTRAL_API_KEY);
          this.isInitialized = true;
          console.log('Mistral client inizializzato con successo');
        } catch (error) {
          console.error('Errore nell\'inizializzazione del client Mistral:', error);
        }
      }
    });
        
        // Map to store activity timestamps for each conversation
        this.conversationTimestamps = new Map();
        
        // Define the system prompt
        this.systemPrompt = `You are an AI assistant for Villa Petriolo, a luxurious villa in Tuscany, Italy. 
Your role is to help guests with information about the villa, nearby attractions, services, 
and assist with bookings. Always be polite, helpful, and provide accurate information 
about Villa Petriolo's amenities, services, and the surrounding area.`;

        // Define the model to use
        this.model = "mistral-medium"; // Use mistral-medium or mistral-small based on needs
    }

    async initializeConversation(sessionId) {
        const messages = [{
            role: "system",
            content: this.systemPrompt
        }];
        
        // Store conversation in Redis with 24-hour expiration
        await redisClient.set(
            `conversation:${sessionId}`,
            JSON.stringify(messages),
            'EX',
            86400 // 24 hours
        );
        
        // Update timestamp
        this.conversationTimestamps.set(sessionId, Date.now());
        
        return messages;
    }

    async getConversationHistory(sessionId) {
        try {
            const history = await redisClient.get(`conversation:${sessionId}`);
            
            if (history) {
                // Update activity timestamp
                this.conversationTimestamps.set(sessionId, Date.now());
                return JSON.parse(history);
            } else {
                return await this.initializeConversation(sessionId);
            }
        } catch (error) {
            console.error('Error retrieving conversation history:', error);
            // Initialize new conversation in case of error
            return await this.initializeConversation(sessionId);
        }
    }

    async updateConversationHistory(sessionId, messages) {
        try {
            // Update conversation in Redis with 24-hour expiration
            await redisClient.set(
                `conversation:${sessionId}`,
                JSON.stringify(messages),
                'EX',
                86400 // 24 hours
            );
            
            // Update activity timestamp
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
            console.log(`Processing message for session ${sessionId}`);
            
            // Verifica se il client Mistral è inizializzato
            if (!this.isInitialized || !this.client) {
                throw new Error('Mistral client not initialized yet');
            }
            
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
            
            // Update system message with context
            let contextIndex = messages.findIndex(msg => msg.role === "system");
            if (contextIndex !== -1) {
                messages[contextIndex].content = this.systemPrompt + '\n\n' + contextContent;
            }

            // Limit conversation size to avoid exceeding context limits
            // Keep the system message and the last N messages
            const MAX_CONTEXT_MESSAGES = 10;
            if (messages.length > MAX_CONTEXT_MESSAGES + 1) { // +1 for system message
                const systemMessage = messages[0];
                messages = [systemMessage, ...messages.slice(messages.length - MAX_CONTEXT_MESSAGES)];
            }

            console.log(`Sending ${messages.length} messages to Mistral API`);

            // Format messages for Mistral API
            const formattedMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Get response from Mistral AI
            const chatResponse = await this.client.chat({
                model: this.model,
                messages: formattedMessages,
                temperature: 0.7,
                maxTokens: 1000
            });

            console.log('Received response from Mistral API');
            
            // Extract the assistant's message
            const assistantMessage = {
                role: "assistant",
                content: chatResponse.choices[0].message.content
            };
            
            // Add the assistant's response to the conversation
            messages.push(assistantMessage);

            // Update conversation history
            await this.updateConversationHistory(sessionId, messages);

            return assistantMessage.content;
        } catch (error) {
            console.error('Error processing message with Mistral API:', error);
            if (error.response) {
                console.error('API response:', error.response.data);
            }
            return "Mi dispiace, si è verificato un errore nella comunicazione. Puoi riprovare più tardi?";
        }
    }

    async cleanupOldConversations() {
        try {
            // Remove conversations inactive for more than 24 hours
            const now = Date.now();
            const keysToDelete = [];
            
            for (const [sessionId, timestamp] of this.conversationTimestamps.entries()) {
                if (now - timestamp > 86400000) { // 24 hours in milliseconds
                    keysToDelete.push(`conversation:${sessionId}`);
                    this.conversationTimestamps.delete(sessionId);
                }
            }
            
            // Delete keys from Redis
            if (keysToDelete.length > 0) {
                await redisClient.del(...keysToDelete);
                console.log(`Cleaned up ${keysToDelete.length} old conversations`);
            }
        } catch (error) {
            console.error('Error cleaning up old conversations:', error);
        }
    }
}

// Create an instance only if API key is available
const mistralService = process.env.MISTRAL_API_KEY ? new MistralService() : null;

// Export the service
module.exports = mistralService;