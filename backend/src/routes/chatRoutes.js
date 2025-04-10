const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { redisClient } = require('../config/database');

// Importiamo i servizi in modo sicuro
let mistralService, openAIService;
try {
    mistralService = require('../services/ai/MistralService');
    console.log('MistralService importato con successo');
} catch (error) {
    console.warn('MistralService not available from primary path:', error.message);
    
    // Prova a reimportare con percorso alternativo
    try {
        mistralService = require('../services/mistralService');
        console.log('MistralService importato dal percorso alternativo');
    } catch (altError) {
        console.warn('MistralService not available from alternative path:', altError.message);
    }
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
    async processMessage(message, sessionId) {
        console.log(`Mock: Processing message for ${sessionId}: ${message}`);
        return `Mi dispiace, al momento il servizio di intelligenza artificiale non è disponibile. La preghiamo di riprovare più tardi o contattare la reception per assistenza immediata.`;
    },
    async getConversationHistory(sessionId) {
        return [{ role: 'system', content: 'This is a mock AI service.' }];
    },
    cleanupOldConversations() {}
};

// SEMPRE PREFERIRE MISTRAL - Usa un service forzato se Mistral è disponibile
const aiService = mistralService || openAIService || mockService;
console.log(`Using AI service: ${mistralService ? 'Mistral' : openAIService ? 'OpenAI' : 'Mock'}`);
if (mistralService) {
    console.log('Mistral service is active and will be used for all requests');
} else {
    console.warn('ATTENZIONE: Mistral service non è disponibile, verrà utilizzato un servizio alternativo!');
}

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

        console.log(`Processing message for session ${sessionId}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
        
        // Assicurati che il servizio AI sia definito
        if (!aiService) {
            throw new Error('AI service not available');
        }
        
        // Tenta di processare il messaggio con un timeout
        let processingTimeout;
        const timeoutPromise = new Promise((_, reject) => {
            processingTimeout = setTimeout(() => {
                reject(new Error('Request timeout after 15 seconds'));
            }, 15000); // 15 secondi di timeout
        });
        
        // Processa il messaggio con controllo del timeout
        const response = await Promise.race([
            aiService.processMessage(message, sessionId),
            timeoutPromise
        ]);
        
        // Annulla il timeout se la richiesta è completata
        clearTimeout(processingTimeout);
        
        // Format response to match frontend expectations
        res.json({
            message: response,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Gestione specifica degli errori
        if (error.message.includes('timeout')) {
            return res.status(504).json({ 
                error: 'Gateway Timeout', 
                message: 'La richiesta ha impiegato troppo tempo. Si prega di riprovare con un messaggio più breve.'
            });
        }
        
        if (error.message.includes('AI service not available')) {
            return res.status(503).json({ 
                error: 'Service Unavailable', 
                message: 'Il servizio di intelligenza artificiale non è al momento disponibile. Si prega di riprovare più tardi.'
            });
        }
        
        // Errore generico
        res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Si è verificato un errore durante l\'elaborazione del messaggio. Si prega di riprovare.'
        });
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

// Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        let bookings = [];
        
        // Recupera prenotazioni da MongoDB se disponibile
        try {
            const Booking = mongoose.model('Booking');
            bookings = await Booking.find().sort({ createdAt: -1 });
            console.log(`Retrieved ${bookings.length} bookings from MongoDB`);
        } catch (mongoError) {
            console.error('Error retrieving bookings from MongoDB:', mongoError);
            
            // Recupera da Redis come fallback
            try {
                const backupData = await redisClient.get('backup_bookings');
                if (backupData) {
                    bookings = JSON.parse(backupData);
                    console.log(`Retrieved ${bookings.length} bookings from Redis backup`);
                }
            } catch (redisError) {
                console.error('Error retrieving backup bookings from Redis:', redisError);
            }
        }
        
        res.json({ bookings });
    } catch (error) {
        console.error('Error retrieving bookings:', error);
        res.status(500).json({ error: 'Failed to retrieve bookings' });
    }
});

// Get menu items
router.get('/menu', async (req, res) => {
    try {
        let menuItems = [];
        
        // Recupera menu da MongoDB se disponibile
        try {
            if (mongoose.models.MenuItem) {
                menuItems = await mongoose.models.MenuItem.find({ available: true });
                console.log(`Retrieved ${menuItems.length} menu items from MongoDB`);
            } else {
                throw new Error('MenuItem model not found');
            }
        } catch (mongoError) {
            console.error('Error retrieving menu items from MongoDB:', mongoError);
            
            // Recupera da Redis come fallback
            try {
                const fallbackData = await redisClient.get('fallback_data');
                if (fallbackData) {
                    const parsedData = JSON.parse(fallbackData);
                    menuItems = parsedData.menu || [];
                    console.log(`Retrieved ${menuItems.length} menu items from fallback data`);
                } else {
                    // Fallback statico se non c'è nulla in Redis
                    menuItems = [
                        {
                            "name": "Pappardelle al ragù di cinghiale",
                            "description": "Pasta fresca con ragù di cinghiale a lunga cottura",
                            "price": 18.00,
                            "category": "Primi",
                            "available": true
                        },
                        {
                            "name": "Bistecca alla fiorentina",
                            "description": "Classica bistecca di manzo chianino alla griglia",
                            "price": 6.00,
                            "priceUnit": "all'etto",
                            "category": "Secondi",
                            "available": true
                        },
                        {
                            "name": "Panna cotta",
                            "description": "Dolce con frutti di bosco e caramello",
                            "price": 8.00,
                            "category": "Dessert",
                            "available": true
                        },
                        {
                            "name": "Vino della casa",
                            "description": "Prodotto dalla nostra vigna",
                            "price": 22.00,
                            "category": "Bevande",
                            "available": true
                        }
                    ];
                    console.log('Using static fallback menu');
                }
            } catch (redisError) {
                console.error('Error retrieving fallback menu:', redisError);
            }
        }
        
        res.json({ menu: menuItems });
    } catch (error) {
        console.error('Error retrieving menu:', error);
        res.status(500).json({ error: 'Failed to retrieve menu' });
    }
});

// Get activities
router.get('/activities', async (req, res) => {
    try {
        let activities = [];
        
        // Recupera attività da MongoDB se disponibile
        try {
            if (mongoose.models.Activity) {
                activities = await mongoose.models.Activity.find({ available: true });
                console.log(`Retrieved ${activities.length} activities from MongoDB`);
            } else {
                throw new Error('Activity model not found');
            }
        } catch (mongoError) {
            console.error('Error retrieving activities from MongoDB:', mongoError);
            
            // Recupera da Redis come fallback
            try {
                const fallbackData = await redisClient.get('fallback_data');
                if (fallbackData) {
                    const parsedData = JSON.parse(fallbackData);
                    activities = parsedData.activities || [];
                    console.log(`Retrieved ${activities.length} activities from fallback data`);
                } else {
                    // Fallback statico
                    activities = [
                        {
                            "name": "Tour del vigneto",
                            "description": "Visita guidata dei vigneti con degustazione",
                            "duration": 120,
                            "price": 25.00,
                            "times": ["10:00", "15:00"],
                            "available": true
                        },
                        {
                            "name": "Lezione di cucina toscana",
                            "description": "Impara a preparare pasta fresca e piatti tipici toscani",
                            "duration": 180,
                            "price": 65.00,
                            "times": ["11:00"],
                            "available": true
                        },
                        {
                            "name": "Passeggiata a cavallo",
                            "description": "Esplora la campagna toscana a cavallo",
                            "duration": 90,
                            "price": 45.00,
                            "times": ["09:00", "16:00"],
                            "available": true
                        },
                        {
                            "name": "Sessione di spa",
                            "description": "Rilassati nella nostra spa con vista panoramica",
                            "duration": 60,
                            "price": 35.00,
                            "times": ["10:00", "14:00", "17:00"],
                            "available": true
                        }
                    ];
                    console.log('Using static fallback activities');
                }
            } catch (redisError) {
                console.error('Error retrieving fallback activities:', redisError);
            }
        }
        
        res.json({ activities });
    } catch (error) {
        console.error('Error retrieving activities:', error);
        res.status(500).json({ error: 'Failed to retrieve activities' });
    }
});

// Create a booking
router.post('/bookings', async (req, res) => {
    try {
        const { service, date, time, guests, name } = req.body;
        
        // Validazione
        if (!service || !date || !time || !guests || !name) {
            return res.status(400).json({ 
                error: 'Dati mancanti', 
                message: 'Tutti i campi (service, date, time, guests, name) sono obbligatori.' 
            });
        }
        
        let bookingId;
        
        // Tenta di salvare in MongoDB
        try {
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
            
            const booking = new Booking({
                service,
                date,
                time,
                guests,
                name,
                status: 'confirmed',
                createdAt: new Date()
            });
            
            const savedBooking = await booking.save();
            bookingId = savedBooking._id;
            console.log(`Prenotazione salvata in MongoDB con ID: ${bookingId}`);
            
        } catch (mongoError) {
            console.error('Errore nel salvataggio della prenotazione in MongoDB:', mongoError);
            
            // Fallback in Redis
            try {
                const backupBookings = JSON.parse(await redisClient.get('backup_bookings') || '[]');
                const newBooking = {
                    id: `local-${Date.now()}`,
                    service,
                    date,
                    time,
                    guests,
                    name,
                    status: 'confirmed',
                    createdAt: new Date().toISOString()
                };
                
                backupBookings.push(newBooking);
                await redisClient.set('backup_bookings', JSON.stringify(backupBookings));
                
                bookingId = newBooking.id;
                console.log(`Prenotazione salvata nel backup Redis con ID: ${bookingId}`);
            } catch (redisError) {
                console.error('Errore anche nel backup della prenotazione:', redisError);
                throw new Error('Impossibile salvare la prenotazione a causa di un errore tecnico.');
            }
        }
        
        // Risposta
        res.status(201).json({
            success: true,
            bookingId,
            message: 'Prenotazione confermata'
        });
        
    } catch (error) {
        console.error('Errore nella creazione della prenotazione:', error);
        res.status(500).json({ 
            error: 'Errore del server', 
            message: error.message || 'Si è verificato un errore durante la prenotazione.' 
        });
    }
});

module.exports = router;