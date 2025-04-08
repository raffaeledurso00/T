// src/services/mistral/linguistic-patch/ResponseFallbacks.js

/**
 * Class providing fallback responses in various languages
 */
class ResponseFallbacks {
    constructor() {
        // Predefined Russian responses
        this.russianResponses = [
            "Привет! Я цифровой консьерж Виллы Петриоло. Чем я могу вам помочь?",
            "Здравствуйте! Я здесь, чтобы помочь вам с любыми вопросами о нашей вилле.",
            "Добро пожаловать! Как я могу сделать ваше пребывание более комфортным?"
        ];
        
        // Error message templates in different languages
        this.errorMessages = {
            it: "Mi scusi, al momento sto avendo problemi con la traduzione. Posso aiutarti in italiano?",
            en: "I'm sorry, I'm currently having trouble with translation. How can I help you in English?",
            fr: "Je suis désolé, j'ai actuellement des problèmes de traduction. Puis-je vous aider en français?",
            es: "Lo siento, actualmente estoy teniendo problemas con la traducción. ¿Puedo ayudarte en español?",
            de: "Es tut mir leid, ich habe derzeit Probleme mit der Übersetzung. Kann ich Ihnen auf Deutsch helfen?",
            zh: "对不起，我目前在翻译方面遇到问题。我可以用中文帮助您吗？",
            ru: "Извините, в настоящее время у меня проблемы с переводом. Могу ли я помочь вам на русском языке?",
            ja: "申し訳ありませんが、現在翻訳に問題があります。日本語でお手伝いできますか？",
            ko: "죄송합니다. 현재 번역에 문제가 있습니다. 한국어로 도와 드릴까요?"
        };
        
        // Greeting templates in different languages
        this.greetings = {
            it: [
                "Ciao! Sono il concierge digitale di Villa Petriolo. Come posso aiutarti?",
                "Buongiorno! Sono qui per assisterti. Come posso esserti utile?",
                "Benvenuto a Villa Petriolo! Sono il tuo assistente digitale. Come posso aiutarti oggi?"
            ],
            en: [
                "Hello! I'm the digital concierge of Villa Petriolo. How can I help you?",
                "Good day! I'm here to assist you. How can I be of service?",
                "Welcome to Villa Petriolo! I'm your digital assistant. How can I help you today?"
            ],
            fr: [
                "Bonjour! Je suis le concierge numérique de Villa Petriolo. Comment puis-je vous aider?",
                "Salut! Je suis là pour vous assister. Comment puis-je vous être utile?",
                "Bienvenue à Villa Petriolo! Je suis votre assistant numérique. Comment puis-je vous aider aujourd'hui?"
            ],
            es: [
                "¡Hola! Soy el conserje digital de Villa Petriolo. ¿Cómo puedo ayudarte?",
                "¡Buenos días! Estoy aquí para asistirte. ¿En qué puedo servirte?",
                "¡Bienvenido a Villa Petriolo! Soy tu asistente digital. ¿Cómo puedo ayudarte hoy?"
            ],
            de: [
                "Hallo! Ich bin der digitale Concierge der Villa Petriolo. Wie kann ich Ihnen helfen?",
                "Guten Tag! Ich bin hier, um Ihnen zu helfen. Wie kann ich Ihnen behilflich sein?",
                "Willkommen in der Villa Petriolo! Ich bin Ihr digitaler Assistent. Wie kann ich Ihnen heute helfen?"
            ],
            ru: [
                "Привет! Я цифровой консьерж Виллы Петриоло. Чем я могу вам помочь?",
                "Здравствуйте! Я здесь, чтобы помочь вам. Чем я могу быть полезен?",
                "Добро пожаловать в Виллу Петриоло! Я ваш цифровой помощник. Чем я могу помочь вам сегодня?"
            ]
        };
    }
    
    /**
     * Get a random Russian response
     * @returns {string} - Russian response
     */
    getRussianResponse() {
        return this.russianResponses[Math.floor(Math.random() * this.russianResponses.length)];
    }
    
    /**
     * Get an error message in the specified language
     * @param {string} language - Language code
     * @returns {string} - Error message
     */
    getErrorMessage(language) {
        return this.errorMessages[language] || this.errorMessages.it;
    }
    
    /**
     * Get a greeting in the specified language
     * @param {string} language - Language code
     * @returns {string} - Greeting
     */
    getGreeting(language) {
        const greetingsForLanguage = this.greetings[language] || this.greetings.it;
        return greetingsForLanguage[Math.floor(Math.random() * greetingsForLanguage.length)];
    }
}

module.exports = ResponseFallbacks;