const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const { connectMongoDB, connectRedis } = require('./config/database');
const passportConfig = require('./config/passport');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const mistralRoutes = require('./routes/mistralRoutes');

// Importa e applica la patch multilingua
const { applyMultilingualPatch } = require('./services/mistral/linguistic-patch');
const mistralService = require('./services/mistralService');

// Applica la patch per supporto multilingua
try {
    applyMultilingualPatch(mistralService);
    console.log('Patch linguistica applicata con successo!');
} catch (error) {
    console.error('Errore nell\'applicazione della patch linguistica:', error);
}

// Importa i servizi AI in modo condizionale
let openAIService;
try {
    openAIService = require('./services/ai/OpenAIService');
} catch (error) {
    console.warn('OpenAI service not available, skipping initialization');
    // Crea un servizio mock
    openAIService = {
        cleanupOldConversations: () => console.log('Mock cleanup - no action needed')
    };
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS options
const corsWhitelist = process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin || corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan('dev'));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mistral', mistralRoutes);  // Aggiungi l'endpoint di test

// Reindirizzamenti per retrocompatibilità
app.all('/chat/*', (req, res) => {
  console.log(`[REDIRECT] ${req.method} ${req.path} -> /api${req.path}`);
  // Ricostruisci l'URL completa con eventuali parametri query
  const redirectUrl = `/api${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
  res.redirect(307, redirectUrl); // 307 mantiene il metodo HTTP originale
});

// Health check endpoints for ping
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.post('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Endpoint per recuperare l'ultimo messaggio di una chat (usato per polling)
app.get('/api/chat/messages/latest/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID richiesto' });
        }
        
        // Simulazione di risposta nel caso in cui il servizio di chat non sia disponibile
        res.json({ 
            message: {
                role: 'assistant',
                content: 'La risposta è in fase di elaborazione. Si prega di attendere o riprovare.'
            }
        });
    } catch (error) {
        console.error('Errore nel recupero dell\'ultimo messaggio:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
});

// Diagnostics endpoint
app.get('/diagnostics', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        env: {
            nodeEnv: process.env.NODE_ENV || 'not set',
            port: process.env.PORT || '3001',
            mongodbUri: process.env.MONGODB_URI ? 'set' : 'not set',
            redisUrl: process.env.REDIS_URL ? 'set' : 'not set',
            mistralApiKey: process.env.MISTRAL_API_KEY ? 'set' : 'not set',
            frontendUrl: process.env.FRONTEND_URL || 'not set',
            corsWhitelist: process.env.CORS_WHITELIST || 'not set'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// Custom request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Initialize database connections
const initializeApp = async () => {
    try {
        await connectMongoDB();
        await connectRedis();
        
        // Start periodic cleanup of old conversations
        setInterval(() => {
            openAIService.cleanupOldConversations();
        }, 3600000); // Every hour

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Knowledge base loaded, concierge ready to assist');
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

initializeApp();