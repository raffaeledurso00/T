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

// Test endpoints for Mistral API
router.post('/chat', mistralController.chat);
router.post('/clear-history', mistralController.clearHistory);
router.post('/init-session', mistralController.initSession);

// Test endpoint that always returns a Russian response
router.post('/test-russian', (req, res) => {
    const russianResponses = [
        "Привет! Я цифровой консьерж Виллы Петриоло. Чем я могу вам помочь?",
        "Здравствуйте! Я здесь, чтобы помочь вам с любыми вопросами о нашей вилле.",
        "Добро пожаловать! Как я могу сделать ваше пребывание более комфортным?"
    ];
    
    const randomResponse = russianResponses[Math.floor(Math.random() * russianResponses.length)];
    
    res.json({
        message: randomResponse,
        sessionId: req.body.sessionId || 'test-session',
        source: 'russian-test',
        language: 'ru'
    });
});

// Test endpoint for multilingual testing - simple endpoint for all languages
router.post('/test-language/:lang', (req, res) => {
    const lang = req.params.lang.toLowerCase();
    
    // Simple responses in various languages
    const langResponses = {
        it: "Ciao! Sono il concierge digitale di Villa Petriolo. Come posso aiutarti oggi?",
        en: "Hello! I'm the digital concierge of Villa Petriolo. How can I help you today?",
        ru: "Привет! Я цифровой консьерж Виллы Петриоло. Чем я могу вам помочь сегодня?",
        fr: "Bonjour! Je suis le concierge numérique de Villa Petriolo. Comment puis-je vous aider aujourd'hui?",
        es: "¡Hola! Soy el conserje digital de Villa Petriolo. ¿Cómo puedo ayudarte hoy?",
        de: "Hallo! Ich bin der digitale Concierge der Villa Petriolo. Wie kann ich Ihnen heute helfen?",
        zh: "你好！我是威拉·佩特里奥洛的数字管家。今天我能帮您什么忙？",
        ja: "こんにちは！私はヴィラ・ペトリオーロのデジタルコンシェルジュです。今日はどのようにお手伝いできますか？"
    };
    
    // Default to Italian if the language is not supported
    const response = langResponses[lang] || langResponses.it;
    
    res.json({
        message: response,
        sessionId: req.body.sessionId || 'test-session',
        source: 'language-test',
        language: lang
    });
});

module.exports = router;