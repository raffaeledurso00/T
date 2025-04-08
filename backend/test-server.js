// test-server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Abilita CORS per tutte le origini
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));

app.use(express.json());

// Health check endpoints
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.post('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Endpoint di test per il ristorante
app.post('/api/mistral/message', (req, res) => {
    console.log('Test endpoint hit:', req.body);
    const { message } = req.body;
    
    if (message && message.toLowerCase().includes('orari') && message.toLowerCase().includes('ristorante')) {
        res.json({
            message: "Il ristorante di Villa Petriolo è aperto tutti i giorni con i seguenti orari:\n\nPranzo: 12:30 - 14:30\nCena: 19:30 - 22:30\n\nPer prenotazioni, può contattare il numero interno 122 o scrivere a ristorante@villapetriolo.com",
            sessionId: req.headers['x-session-id'] || 'test-session',
            source: 'test-server',
            language: 'it'
        });
    } else {
        res.json({
            message: "Questo è un server di test. Il messaggio ricevuto è: " + (message || "nessun messaggio"),
            sessionId: req.headers['x-session-id'] || 'test-session',
            source: 'test-server',
            language: 'it'
        });
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/ping`);
});