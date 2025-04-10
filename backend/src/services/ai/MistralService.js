            // SERVIZI HOTEL - Formatta in modo leggibile e preciso
            if (servizi.servizi_hotel && servizi.servizi_hotel.length > 0) {
                contextContent += `
SERVIZI DELL'HOTEL:
`;
                servizi.servizi_hotel.forEach(servizio => {
                    contextContent += `- ${servizio.nome}: ${servizio.orari}
  ${servizio.descrizione}
`;
                });
            }
            
            // SERVIZI BENESSERE - Formatta in modo leggibile e preciso
            if (servizi.servizi_benessere && servizi.servizi_benessere.length > 0) {
                contextContent += `
SERVIZI BENESSERE:
`;
                servizi.servizi_benessere.forEach(servizio => {
                    let prezzo = servizio.prezzo ? ` - ${servizio.prezzo}` : '';
                    let prenotazione = servizio.prenotazione ? ` - ${servizio.prenotazione}` : '';
                    contextContent += `- ${servizio.nome}: ${servizio.orari}${prezzo}
  ${servizio.descrizione}${prenotazione}
`;
                });
            }
            
            // SERVIZI EXTRA - Formatta in modo leggibile e preciso
            if (servizi.servizi_extra && servizi.servizi_extra.length > 0) {
                contextContent += `
SERVIZI EXTRA:
`;
                servizi.servizi_extra.forEach(servizio => {
                    let orari = servizio.orari ? `${servizio.orari}` : '';
                    let prezzo = servizio.prezzo ? ` - ${servizio.prezzo}` : '';
                    let prenotazione = servizio.prenotazione ? ` - ${servizio.prenotazione}` : '';
                    contextContent += `- ${servizio.nome}: ${orari}${prezzo}
  ${servizio.descrizione}${prenotazione}
`;
                });
            }
            
            // ATTIVITA' NELLA STRUTTURA - Formatta in modo leggibile e preciso
            if (attivita.nella_struttura && attivita.nella_struttura.length > 0) {
                contextContent += `
ATTIVITA' NELLA STRUTTURA:
`;
                attivita.nella_struttura.forEach(a => {
                    let prezzo = a.prezzo ? ` - €${a.prezzo}` : '';
                    let prenotazione = a.prenotazione ? ` - ${a.prenotazione}` : '';
                    contextContent += `- ${a.nome}: ${a.orari}${prezzo}
  ${a.descrizione}${prenotazione}
`;
                });
            }
            
            // ATTIVITA' NEI DINTORNI - Formatta in modo leggibile e preciso
            if (attivita.nei_dintorni && attivita.nei_dintorni.length > 0) {
                contextContent += `
ATTIVITA' NEI DINTORNI:
`;
                attivita.nei_dintorni.forEach(a => {
                    let distanza = a.distanza ? ` (${a.distanza})` : '';
                    let prezzo = a.prezzo ? ` - €${a.prezzo}` : '';
                    let prenotazione = a.prenotazione ? ` - ${a.prenotazione}` : '';
                    contextContent += `- ${a.nome}${distanza}${prezzo}
  ${a.descrizione}${prenotazione}
`;
                });
            }
            
            // EVENTI - Formatta in modo leggibile e preciso
            if (eventi.prossimi_eventi && eventi.prossimi_eventi.length > 0) {
                contextContent += `
PROSSIMI EVENTI:
`;
                eventi.prossimi_eventi.forEach(e => {
                    let data = e.data ? `Data: ${e.data}` : '';
                    let ora = e.ora ? `, Ora: ${e.ora}` : '';
                    let luogo = e.luogo ? `, Luogo: ${e.luogo}` : '';
                    let prezzo = e.prezzo ? `, Prezzo: ${e.prezzo}` : '';
                    contextContent += `- ${e.nome}
  ${data}${ora}${luogo}${prezzo}
  ${e.descrizione}
`;
                });
            }// src/services/ai/MistralService.js
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
            // Dati di fallback in caso di problemi con il DB
            return {
                "name": "Villa Petriolo",
                "address": "Via di Petriolo, 5, 50063 Figline Valdarno FI",
                "coordinates": "43.6203, 11.4254",
                "description": "Lussuosa villa toscana con ristorante biologico, piscina panoramica, spa e vigna.",
                "checkIn": "14:00",
                "checkOut": "11:00",
                "wifiPassword": "VillaPetriolo2024",
                "contacts": {
                    "reception": "+39 055 123456",
                    "emergency": "+39 055 123457",
                    "email": "info@villapetriolo.it"
                }
            };
        }
    }

    async getAvailableServices() {
        try {
            return await Service.find({ available: true });
        } catch (error) {
            console.error('Error retrieving available services:', error);
            // Fallback data in caso di errore nel DB
            return [
                {
                    "name": "Ristorante",
                    "description": "Cucina toscana con ingredienti biologici dell'azienda agricola.",
                    "available": true,
                    "openingHours": "12:00-15:00, 19:00-22:30",
                    "requiresReservation": true
                },
                {
                    "name": "Massaggio",
                    "description": "Massaggi rilassanti e terapeutici.",
                    "available": true,
                    "duration": 50,
                    "requiresReservation": true
                },
                {
                    "name": "Tour del vigneto",
                    "description": "Visita guidata dei vigneti con degustazione.",
                    "available": true,
                    "duration": 120,
                    "requiresReservation": true
                },
                {
                    "name": "Piscina",
                    "description": "Piscina riscaldata con vista panoramica.",
                    "available": true,
                    "openingHours": "08:00-20:00",
                    "requiresReservation": false
                }
            ];
        }
    }

    async processMessage(sessionId, userMessage) {
        try {
            console.log(`Processing message for session ${sessionId}`);
            
            // Verifica se il client Mistral è inizializzato
            if (!this.isInitialized || !this.client) {
                console.error('Mistral client not initialized - attempting initialization');
                
                // Prova a reinizializzare
                if (MistralClient) {
                    try {
                        this.client = new MistralClient(process.env.MISTRAL_API_KEY);
                        this.isInitialized = true;
                        console.log('Mistral client reinizializzato con successo');
                    } catch (initError) {
                        console.error('Reinizializzazione fallita:', initError);
                        throw new Error('Mistral client initialization failed');
                    }
                } else {
                    throw new Error('MistralClient class not available');
                }
            }
            
            let messages = await this.getConversationHistory(sessionId);
            
            // Add user message to conversation
            messages.push({
                role: "user",
                content: userMessage
            });

            // Carica direttamente TUTTI i dati JSON dai file
            console.log('Carico tutti i dati dai file JSON originali...');
            let ristorante = {};
            let servizi = {};
            let attivita = {};
            let eventi = {};
            
            try {
                ristorante = require('../../data/ristorante.json');
                console.log('Dati ristorante caricati con successo');
            } catch (e) {
                console.error('Errore nel caricamento del file ristorante.json:', e);
            }
            
            try {
                servizi = require('../../data/servizi.json');
                console.log('Dati servizi caricati con successo');
            } catch (e) {
                console.error('Errore nel caricamento del file servizi.json:', e);
            }
            
            try {
                attivita = require('../../data/attivita.json');
                console.log('Dati attività caricati con successo');
            } catch (e) {
                console.error('Errore nel caricamento del file attivita.json:', e);
            }
            
            try {
                eventi = require('../../data/eventi.json');
                console.log('Dati eventi caricati con successo');
            } catch (e) {
                console.error('Errore nel caricamento del file eventi.json:', e);
            }
            
            // Create ENHANCED context message
            let contextContent = `
Sei l'assistente ufficiale di Villa Petriolo. Rispondi sempre in italiano. Devi fornire informazioni precise, gestire prenotazioni e garantire un'esperienza eccellente agli ospiti.

REGOLE IMPORTANTI:
1. Se un cliente chiede di prenotare QUALSIASI servizio, raccogli SEMPRE tutti i dettagli necessari (data, ora, numero di persone, nome).
2. Utilizza SEMPRE i dati forniti nel contesto per rispondere con precisione e dettaglio.
3. Se richiesto di prenotare, conferma SEMPRE ripetendo tutti i dettagli della prenotazione.
4. Per richieste di ristorazione, illustra sempre le opzioni del menu disponibili con dettagli.
5. Sii proattivo e offri suggerimenti basati sulle preferenze dell'ospite.
`;

            // RISTORANTE - Aggiungi dati precisi dal file JSON
            if (ristorante.orari) {
                contextContent += `
RISTORANTE ORARI E PRENOTAZIONI:
`;
                contextContent += `- Pranzo: ${ristorante.orari.pranzo}
`;
                contextContent += `- Cena: ${ristorante.orari.cena}
`;
                contextContent += `- Giorni di apertura: ${ristorante.orari.giorni_apertura}
`;
                
                if (ristorante.prenotazioni) {
                    contextContent += `- Prenotazioni: telefono ${ristorante.prenotazioni.telefono}, email ${ristorante.prenotazioni.email}
`;
                }
            }
            
            // MENU DEL RISTORANTE - Formatta in modo leggibile e preciso
            if (ristorante.menu) {
                contextContent += `
MENU DEL RISTORANTE:
`;
                
                // Formatta gli antipasti
                if (ristorante.menu.antipasti && ristorante.menu.antipasti.length > 0) {
                    contextContent += `ANTIPASTI:
`;
                    ristorante.menu.antipasti.forEach(item => {
                        contextContent += `- ${item.nome} - €${item.prezzo}
`;
                    });
                }
                
                // Formatta i primi
                if (ristorante.menu.primi && ristorante.menu.primi.length > 0) {
                    contextContent += `
PRIMI:
`;
                    ristorante.menu.primi.forEach(item => {
                        contextContent += `- ${item.nome} - €${item.prezzo}
`;
                    });
                }
                
                // Formatta i secondi
                if (ristorante.menu.secondi && ristorante.menu.secondi.length > 0) {
                    contextContent += `
SECONDI:
`;
                    ristorante.menu.secondi.forEach(item => {
                        contextContent += `- ${item.nome} - €${item.prezzo}
`;
                    });
                }
                
                // Formatta i dolci
                if (ristorante.menu.dolci && ristorante.menu.dolci.length > 0) {
                    contextContent += `
DOLCI:
`;
                    ristorante.menu.dolci.forEach(item => {
                        contextContent += `- ${item.nome} - €${item.prezzo}
`;
                    });
                }
            }
            
            if (villaInfo) {
                contextContent += `\nINFORMAZIONI SULLA VILLA:\n${JSON.stringify(villaInfo, null, 2)}\n`;
            }
            
            // Aggiungi il menu del ristorante
            if (restaurantData.menu) {
                contextContent += `\nMENU DEL RISTORANTE:\n`;
                
                // Aggiungi antipasti
                if (restaurantData.menu.antipasti && restaurantData.menu.antipasti.length > 0) {
                    contextContent += `Antipasti:\n`;
                    restaurantData.menu.antipasti.forEach((item) => {
                        contextContent += `- ${item.nome}: €${item.prezzo}\n`;
                    });
                }
                
                // Aggiungi primi
                if (restaurantData.menu.primi && restaurantData.menu.primi.length > 0) {
                    contextContent += `\nPrimi:\n`;
                    restaurantData.menu.primi.forEach((item) => {
                        contextContent += `- ${item.nome}: €${item.prezzo}\n`;
                    });
                }
                
                // Aggiungi secondi
                if (restaurantData.menu.secondi && restaurantData.menu.secondi.length > 0) {
                    contextContent += `\nSecondi:\n`;
                    restaurantData.menu.secondi.forEach((item) => {
                        contextContent += `- ${item.nome}: €${item.prezzo}\n`;
                    });
                }
                
                // Aggiungi dolci
                if (restaurantData.menu.dolci && restaurantData.menu.dolci.length > 0) {
                    contextContent += `\nDolci:\n`;
                    restaurantData.menu.dolci.forEach((item) => {
                        contextContent += `- ${item.nome}: €${item.prezzo}\n`;
                    });
                }
            }
            
            if (availableServices && availableServices.length > 0) {
                contextContent += `\nSERVIZI DISPONIBILI:\n${JSON.stringify(availableServices, null, 2)}\n`;
            }
            
            if (menuItems && menuItems.length > 0) {
                contextContent += `\nMENU DEL RISTORANTE:\n${JSON.stringify(menuItems, null, 2)}\n`;
            }
            
            // Carica anche i servizi direttamente dal file
            try {
                const serviziData = require('../../data/servizi.json');
                
                // Aggiungi i servizi direttamente nel contesto
                if (serviziData.servizi_hotel) {
                    contextContent += `\nSERVIZI HOTEL:\n`;
                    serviziData.servizi_hotel.forEach((servizio) => {
                        contextContent += `- ${servizio.nome}: ${servizio.orari}\n  ${servizio.descrizione}\n`;
                    });
                }
                
                if (serviziData.servizi_benessere) {
                    contextContent += `\nSERVIZI BENESSERE:\n`;
                    serviziData.servizi_benessere.forEach((servizio) => {
                        const prezzoInfo = servizio.prezzo ? ` - ${servizio.prezzo}` : '';
                        const prenotazioneInfo = servizio.prenotazione ? ` - ${servizio.prenotazione}` : '';
                        contextContent += `- ${servizio.nome}: ${servizio.orari}${prezzoInfo}\n  ${servizio.descrizione}${prenotazioneInfo}\n`;
                    });
                }
                
                console.log('Dati servizi caricati con successo');
            } catch (serviziError) {
                console.error('Errore nel caricamento dei dati servizi:', serviziError);
            }
            
            if (activities && activities.length > 0) {
                contextContent += `\nATTIVITÀ DISPONIBILI:\n${JSON.stringify(activities, null, 2)}\n`;
            }
            
            if (bookings && bookings.length > 0) {
                contextContent += `\nPRENOTAZIONI ATTUALI:\n${JSON.stringify(bookings, null, 2)}\n`;
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

            // Analizza se si tratta di una richiesta di prenotazione
            const isBookingRequest = this.isBookingRequest(userMessage);
            console.log(`È una richiesta di prenotazione? ${isBookingRequest ? 'Sì' : 'No'}`);
            
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
            
            // Se è una richiesta di prenotazione, verifica se abbiamo tutti i dettagli necessari
            let finalResponse = assistantMessage.content;
            
            if (isBookingRequest) {
                // Cerca di estrarre i dettagli della prenotazione dalla risposta del modello
                const bookingDetails = this.extractBookingDetails(userMessage, finalResponse);
                
                if (bookingDetails.isComplete) {
                    try {
                        // Tenta di creare la prenotazione
                        const bookingResult = await this.createBooking(bookingDetails);
                        
                        if (bookingResult.success) {
                            // Aggiunge conferma alla risposta
                            finalResponse += `\n\n**PRENOTAZIONE CONFERMATA**\nID Prenotazione: ${bookingResult.bookingId}\nServizio: ${bookingDetails.service}\nData: ${bookingDetails.date}\nOra: ${bookingDetails.time}\nPersone: ${bookingDetails.guests}\nNome: ${bookingDetails.name}\n`;
                            console.log(`Prenotazione creata con successo: ${bookingResult.bookingId}`);
                        } else {
                            // Aggiunge messaggio di errore
                            finalResponse += `\n\nMi dispiace, si è verificato un problema con la prenotazione. ${bookingResult.error}`;
                        }
                    } catch (bookingError) {
                        console.error('Errore durante la creazione della prenotazione:', bookingError);
                        finalResponse += '\n\nMi dispiace, si è verificato un errore tecnico durante la prenotazione. Contatta la reception per assistenza.';
                    }
                }
            }
            
            // Aggiorna il messaggio dell'assistente con la risposta finale
            assistantMessage.content = finalResponse;
            
            // Add the assistant's response to the conversation
            messages.push(assistantMessage);

            // Update conversation history
            await this.updateConversationHistory(sessionId, messages);

            return finalResponse;
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

    /**
     * Verifica se un messaggio è una richiesta di prenotazione
     * @param {string} message - Messaggio dell'utente
     * @returns {boolean} - True se è una richiesta di prenotazione
     */
    isBookingRequest(message) {
        const bookingKeywords = [
            'prenota', 'prenotare', 'prenotazione', 'prenotazioni',
            'riservare', 'riserva', 'riservazione', 'riservazioni',
            'appuntamento', 'appuntamenti', 'fissare', 'fissa',
            'tavolo', 'posto', 'massaggio', 'spa', 'piscina', 'tour', 'visita',
            'ristorante', 'cena', 'pranzo', 'colazione'
        ];
        
        const lowerMessage = message.toLowerCase();
        return bookingKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    /**
     * Estrae dettagli di prenotazione da un messaggio
     * @param {string} userMessage - Messaggio dell'utente
     * @param {string} aiResponse - Risposta dell'AI
     * @returns {Object} - Dettagli della prenotazione
     */
    extractBookingDetails(userMessage, aiResponse) {
        const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
        
        // Estrai il servizio richiesto
        let service = null;
        const serviceMatches = combinedText.match(/(?:prenota|prenotare|prenotazione|riservare|riserva)\s+(?:un|una|il|la|per|al)?\s+([\w\s]+?)(?:\s+per|\s+il|\s+alle|\s+al|\.|,|$)/i);
        if (serviceMatches && serviceMatches[1]) {
            service = serviceMatches[1].trim();
        }
        
        // Altri servizi comuni
        const services = ['massaggio', 'ristorante', 'tour del vigneto', 'piscina', 'spa'];
        for (const s of services) {
            if (combinedText.includes(s)) {
                service = s;
                break;
            }
        }
        
        // Estrai la data
        let date = null;
        const dateMatches = combinedText.match(/(?:il|per il|data|giorno)\s+([0-9]{1,2}[\/-][0-9]{1,2}(?:[\/-][0-9]{2,4})?)/i);
        if (dateMatches && dateMatches[1]) {
            date = dateMatches[1];
        } else {
            // Cerca date in formato testuale
            const dayMatches = combinedText.match(/(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)\s+([0-9]{1,2})(?:\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))?/i);
            if (dayMatches) {
                date = dayMatches[0];
            }
        }
        
        // Estrai l'orario
        let time = null;
        const timeMatches = combinedText.match(/(?:alle|ore|orario|per le)\s+([0-9]{1,2}(?::[0-9]{2})?)/i);
        if (timeMatches && timeMatches[1]) {
            time = timeMatches[1];
        }
        
        // Estrai il numero di persone
        let guests = null;
        const guestsMatches = combinedText.match(/(?:per|con)\s+([0-9]+)\s+(?:persone|persona|ospiti|ospite|personi|gente)/i);
        if (guestsMatches && guestsMatches[1]) {
            guests = guestsMatches[1];
        } else {
            // Cerca numeri di persone in formato testuale
            const textualNumberMatches = combinedText.match(/(?:per|con)\s+(?:una|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+(?:persone|persona|ospiti|ospite)/i);
            if (textualNumberMatches) {
                const numberWords = {
                    'una': '1',
                    'due': '2',
                    'tre': '3',
                    'quattro': '4',
                    'cinque': '5',
                    'sei': '6',
                    'sette': '7',
                    'otto': '8',
                    'nove': '9',
                    'dieci': '10'
                };
                
                for (const [word, num] of Object.entries(numberWords)) {
                    if (textualNumberMatches[0].includes(word)) {
                        guests = num;
                        break;
                    }
                }
            }
        }
        
        // Estrai il nome
        let name = null;
        const nameMatches = combinedText.match(/(?:a nome di|nome|per)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)(?:\.|,|$)/i);
        if (nameMatches && nameMatches[1]) {
            name = nameMatches[1].trim();
        }
        
        // Verifica se abbiamo tutti i dettagli necessari
        const isComplete = service && date && time && guests && name;
        
        return {
            service,
            date,
            time,
            guests,
            name,
            isComplete
        };
    }
    
    /**
     * Crea una prenotazione nel database
     * @param {Object} details - Dettagli della prenotazione
     * @returns {Object} - Risultato dell'operazione
     */
    async createBooking(details) {
        try {
            // Tenta di trovare il modello Booking
            let Booking;
            try {
                Booking = mongoose.model('Booking');
            } catch (modelError) {
                // Se il modello non è registrato, crealo
                console.log('Modello Booking non trovato, creazione del modello...');
                
                const bookingSchema = new mongoose.Schema({
                    service: { type: String, required: true },
                    date: { type: String, required: true },
                    time: { type: String, required: true },
                    guests: { type: String, required: true },
                    name: { type: String, required: true },
                    status: { type: String, default: 'confirmed' },
                    createdAt: { type: Date, default: Date.now }
                });
                
                Booking = mongoose.model('Booking', bookingSchema);
            }
            
            // Crea la prenotazione
            const booking = new Booking({
                service: details.service,
                date: details.date,
                time: details.time,
                guests: details.guests,
                name: details.name
            });
            
            const savedBooking = await booking.save();
            
            return {
                success: true,
                bookingId: savedBooking._id
            };
        } catch (error) {
            console.error('Errore nella creazione della prenotazione:', error);
            
            // Salva in un backup locale se MongoDB non è disponibile
            try {
                const backupBookings = JSON.parse(await redisClient.get('backup_bookings') || '[]');
                const newBooking = {
                    id: `local-${Date.now()}`,
                    ...details,
                    createdAt: new Date().toISOString()
                };
                
                backupBookings.push(newBooking);
                await redisClient.set('backup_bookings', JSON.stringify(backupBookings));
                
                return {
                    success: true,
                    bookingId: newBooking.id,
                    isBackup: true
                };
            } catch (backupError) {
                console.error('Errore anche nel backup della prenotazione:', backupError);
                return {
                    success: false,
                    error: 'Impossibile salvare la prenotazione a causa di un errore tecnico.'
                };
            }
        }
    }
}

// Create an instance only if API key is available
const mistralService = process.env.MISTRAL_API_KEY ? new MistralService() : null;

// Export the service
module.exports = mistralService;