// backend/src/routes/mistralRoutes.js
const express = require('express');
const router = express.Router();
const mistralController = require('../controllers/mistralController');

// Main chat routes
router.post('/message', (req, res) => {
    console.log('Mistral route hit via /api/chat/message');
    mistralController.chat(req, res);
});

router.post('/clear-history', mistralController.clearHistory);
router.post('/init', mistralController.initSession);

// Debug route
router.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Mistral AI',
        mode: process.env.MISTRAL_API_KEY ? 'API' : 'Fallback',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;