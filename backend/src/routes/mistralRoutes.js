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

// Language detection test route
router.post('/test-language', (req, res) => {
    try {
        const { message } = req.body;
        
        console.log(`Test language endpoint received: "${message}" (${typeof message})`);
        console.log(`Message length: ${message ? message.length : 0}`);
        
        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }
        
        const LanguageDetector = require('../services/mistral/LanguageDetector');
        const detector = new LanguageDetector();
        
        // Basic debug info
        const isChinese = /[\u4e00-\u9fff]/.test(message);
        const isCyrillic = /[\u0400-\u04FF]/.test(message);
        const isJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(message);
        
        // Detect language
        const detectedLanguage = detector.detect(message);
        
        res.json({
            message,
            messageBase64: Buffer.from(message).toString('base64'),
            firstCharCode: message.charCodeAt(0),
            firstChar: message[0],
            isChinese,
            isCyrillic,
            isJapanese,
            detectedLanguage,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in test-language endpoint:', error);
        res.status(500).json({
            error: 'Error testing language detection',
            details: error.message
        });
    }
});

// Direct test for Cyrillic characters
router.get('/test-cyrillic', (req, res) => {
    const textToTest = req.query.text || 'ПРИВЕТ';
    
    console.log(`Testing for Cyrillic: "${textToTest}"`);
    console.log(`Text length: ${textToTest.length}`);
    
    // Analyze each character
    const charAnalysis = [];
    for (let i = 0; i < textToTest.length; i++) {
        const char = textToTest[i];
        const code = char.charCodeAt(0);
        const isInCyrillicRange = code >= 0x0400 && code <= 0x04FF;
        
        charAnalysis.push({
            char,
            code, 
            hex: `0x${code.toString(16)}`,
            isCyrillic: isInCyrillicRange
        });
    }
    
    // Test regex for Cyrillic
    const containsCyrillic = /[\u0400-\u04FF]/.test(textToTest);
    const cyrillicMatches = textToTest.match(/[\u0400-\u04FF]/g);
    
    res.json({
        text: textToTest,
        length: textToTest.length,
        characters: charAnalysis,
        containsCyrillic,
        cyrillicMatches: cyrillicMatches ? cyrillicMatches.join('') : null,
        cyrillicMatchCount: cyrillicMatches ? cyrillicMatches.length : 0,
        textBase64: Buffer.from(textToTest).toString('base64'),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;