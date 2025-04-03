// src/services/mistral/MultiLanguageHandler.js
// Gestisce le traduzioni e formattazioni specifiche per lingua

class MultiLanguageHandler {
    constructor() {
        // Template di saluti per diverse lingue
        this.greetingTemplates = {
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
            ru: [
                "Привет! Я цифровой консьерж виллы Петриоло. Чем я могу вам помочь?",
                "Добрый день! Я здесь, чтобы помочь вам. Как я могу быть полезен?",
                "Добро пожаловать в Виллу Петриоло! Я ваш цифровой ассистент. Чем я могу помочь вам сегодня?"
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
            zh: [
                "你好！我是威拉·佩特里奥洛的数字管家。我能为您做些什么？",
                "您好！我是您的服务助手。我能如何帮助您？",
                "欢迎来到威拉·佩特里奥洛！我是您的数字助手。今天我能为您做些什么？"
            ],
            ru: [
                "Привет! Я цифровой консьерж Виллы Петриоло. Чем я могу вам помочь?",
                "Здравствуйте! Я здесь, чтобы помочь вам. Чем я могу быть полезен?",
                "Добро пожаловать в Виллу Петриоло! Я ваш цифровой помощник. Чем я могу помочь вам сегодня?"
            ],
            ja: [
                "こんにちは！ヴィラ・ペトリオーロのデジタルコンシェルジュです。どのようにお手伝いしましょうか？",
                "こんにちは！お手伝いさせていただきます。ご用件は何でしょうか？",
                "ヴィラ・ペトリオーロへようこそ！私はデジタルアシスタントです。今日はどのようにお手伝いできますか？"
            ],
            ko: [
                "안녕하세요! 빌라 페트리올로의 디지털 컨시어지입니다. 어떻게 도와드릴까요?",
                "반갑습니다! 도움이 필요하시면 말씀해주세요. 어떤 서비스가 필요하신가요?",
                "빌라 페트리올로에 오신 것을 환영합니다! 저는 디지털 비서입니다. 오늘 어떻게 도와드릴까요?"
            ],
            ar: [
                "مرحباً! أنا المستشار الرقمي لفيلا بتريولو. كيف يمكنني مساعدتك؟",
                "أهلاً! أنا هنا لمساعدتك. كيف يمكنني أن أكون مفيداً لك؟",
                "مرحباً بك في فيلا بتريولو! أنا مساعدك الرقمي. كيف يمكنني مساعدتك اليوم؟"
            ],
            pt: [
                "Olá! Sou o concierge digital da Villa Petriolo. Como posso ajudá-lo?",
                "Bom dia! Estou aqui para ajudá-lo. Como posso ser útil?",
                "Bem-vindo à Villa Petriolo! Sou seu assistente digital. Como posso ajudá-lo hoje?"
            ],
            nl: [
                "Hallo! Ik ben de digitale conciërge van Villa Petriolo. Hoe kan ik u helpen?",
                "Goedendag! Ik ben hier om u te assisteren. Hoe kan ik van dienst zijn?",
                "Welkom bij Villa Petriolo! Ik ben uw digitale assistent. Hoe kan ik u vandaag helpen?"
            ],
            hi: [
                "नमस्ते! मैं विला पेट्रिओलो का डिजिटल कॉन्सीयर्ज हूं। मैं आपकी कैसे मदद कर सकता हूं?",
                "नमस्कार! मैं आपकी सहायता के लिए यहां हूं। मैं आपके लिए क्या कर सकता हूं?",
                "विला पेट्रिओलो में आपका स्वागत है! मैं आपका डिजिटल सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
            ],
            tr: [
                "Merhaba! Ben Villa Petriolo'nun dijital concierge'iyim. Size nasıl yardımcı olabilirim?",
                "Merhaba! Size yardımcı olmak için buradayım. Nasıl hizmet edebilirim?",
                "Villa Petriolo'ya hoş geldiniz! Ben dijital asistanınızım. Bugün size nasıl yardımcı olabilirim?"
            ],
            pl: [
                "Cześć! Jestem cyfrowym concierge Willi Petriolo. Jak mogę ci pomóc?",
                "Dzień dobry! Jestem tutaj, aby ci pomóc. W czym mogę służyć?",
                "Witamy w Willi Petriolo! Jestem twoim cyfrowym asystentem. Jak mogę ci dzisiaj pomóc?"
            ],
            sv: [
                "Hej! Jag är den digitala conciergen på Villa Petriolo. Hur kan jag hjälpa dig?",
                "God dag! Jag är här för att hjälpa dig. Hur kan jag vara till tjänst?",
                "Välkommen till Villa Petriolo! Jag är din digitala assistent. Hur kan jag hjälpa dig idag?"
            ],
            th: [
                "สวัสดี! ฉันเป็นพนักงานต้อนรับดิจิทัลของวิลลา เพทริโอโล ฉันช่วยอะไรคุณได้บ้าง?",
                "สวัสดี! ฉันอยู่ที่นี่เพื่อช่วยเหลือคุณ ฉันสามารถช่วยอะไรคุณได้บ้าง?",
                "ยินดีต้อนรับสู่วิลลา เพทริโอโล! ฉันเป็นผู้ช่วยดิจิทัลของคุณ วันนี้ฉันช่วยอะไรคุณได้บ้าง?"
            ]
        };
        
        // Template di errore per diverse lingue
        this.errorTemplates = {
            it: "Mi scusi, si è verificato un errore. Potrebbe riprovare?",
            en: "I'm sorry, an error occurred. Could you try again?",
            fr: "Je suis désolé, une erreur s'est produite. Pourriez-vous réessayer?",
            es: "Lo siento, ha ocurrido un error. ¿Podrías intentarlo de nuevo?",
            de: "Es tut mir leid, ein Fehler ist aufgetreten. Könnten Sie es erneut versuchen?",
            zh: "对不起，发生了错误。您能再试一次吗？",
            ru: "Извините, произошла ошибка. Не могли бы вы попробовать еще раз? Пожалуйста, повторите ваш вопрос на русском языке.",
            ja: "申し訳ありません、エラーが発生しました。もう一度お試しいただけますか？",
            ko: "죄송합니다, 오류가 발생했습니다. 다시 시도해 주시겠어요?",
            ar: "آسف، حدث خطأ. هل يمكنك المحاولة مرة أخرى؟",
            pt: "Desculpe, ocorreu um erro. Poderia tentar novamente?",
            nl: "Het spijt me, er is een fout opgetreden. Zou je het opnieuw kunnen proberen?",
            hi: "क्षमा करें, एक त्रुटि हुई है। क्या आप फिर से प्रयास कर सकते हैं?",
            tr: "Üzgünüm, bir hata oluştu. Tekrar deneyebilir misiniz?",
            pl: "Przepraszam, wystąpił błąd. Czy możesz spróbować ponownie?",
            sv: "Jag är ledsen, ett fel uppstod. Kan du försöka igen?",
            th: "ขออภัย เกิดข้อผิดพลาด คุณช่วยลองอีกครั้งได้ไหม?"
        };
        
        // Sezioni menu per diverse lingue
        this.menuSections = {
            it: {
                antipasti: "ANTIPASTI:",
                primi: "PRIMI:",
                secondi: "SECONDI:",
                dolci: "DOLCI:"
            },
            en: {
                antipasti: "STARTERS:",
                primi: "FIRST COURSES:",
                secondi: "MAIN COURSES:",
                dolci: "DESSERTS:"
            },
            fr: {
                antipasti: "ENTRÉES:",
                primi: "PLATS PRINCIPAUX:",
                secondi: "VIANDES ET POISSONS:",
                dolci: "DESSERTS:"
            },
            es: {
                antipasti: "ENTRANTES:",
                primi: "PRIMEROS PLATOS:",
                secondi: "PLATOS PRINCIPALES:",
                dolci: "POSTRES:"
            },
            de: {
                antipasti: "VORSPEISEN:",
                primi: "ERSTE GÄNGE:",
                secondi: "HAUPTGERICHTE:",
                dolci: "DESSERTS:"
            },
            zh: {
                antipasti: "开胃菜:",
                primi: "第一道菜:",
                secondi: "主菜:",
                dolci: "甜点:"
            },
            ru: {
                antipasti: "ЗАКУСКИ:",
                primi: "ПЕРВЫЕ БЛЮДА:",
                secondi: "ОСНОВНЫЕ БЛЮДА:",
                dolci: "ДЕСЕРТЫ:"
            },
            ja: {
                antipasti: "前菜:",
                primi: "パスタ＆リゾット:",
                secondi: "メインディッシュ:",
                dolci: "デザート:"
            },
            ko: {
                antipasti: "에피타이저:",
                primi: "파스타 및 첫 요리:",
                secondi: "메인 요리:",
                dolci: "디저트:"
            },
            ar: {
                antipasti: "المقبلات:",
                primi: "الأطباق الأولى:",
                secondi: "الأطباق الرئيسية:",
                dolci: "الحلويات:"
            },
            pt: {
                antipasti: "ENTRADAS:",
                primi: "PRIMEIROS PRATOS:",
                secondi: "PRATOS PRINCIPAIS:",
                dolci: "SOBREMESAS:"
            },
            nl: {
                antipasti: "VOORGERECHTEN:",
                primi: "EERSTE GANGEN:",
                secondi: "HOOFDGERECHTEN:",
                dolci: "DESSERTS:"
            },
            hi: {
                antipasti: "स्टार्टर्स:",
                primi: "प्रथम व्यंजन:",
                secondi: "मुख्य व्यंजन:",
                dolci: "मिठाई:"
            },
            tr: {
                antipasti: "BAŞLANGIÇLAR:",
                primi: "BİRİNCİ YEMEKLER:",
                secondi: "ANA YEMEKLER:",
                dolci: "TATLILAR:"
            },
            pl: {
                antipasti: "PRZYSTAWKI:",
                primi: "PIERWSZE DANIA:",
                secondi: "DANIA GŁÓWNE:",
                dolci: "DESERY:"
            },
            sv: {
                antipasti: "FÖRRÄTTER:",
                primi: "FÖRSTA RÄTTER:",
                secondi: "HUVUDRÄTTER:",
                dolci: "EFTERRÄTTER:"
            },
            th: {
                antipasti: "อาหารเรียกน้ำย่อย:",
                primi: "จานแรก:",
                secondi: "จานหลัก:",
                dolci: "ของหวาน:"
            }
        };
    }
    
    /**
     * Ottiene un saluto casuale nella lingua specificata
     * @param {string} language - Codice lingua (it, en, fr, es, de, zh)
     * @returns {string} Saluto nella lingua specificata
     */
    getRandomGreeting(language) {
        // Default a italiano se la lingua non è supportata
        const templates = this.greetingTemplates[language] || this.greetingTemplates.it;
        const randomIndex = Math.floor(Math.random() * templates.length);
        return templates[randomIndex];
    }
    
    /**
     * Ottiene il messaggio di errore nella lingua specificata
     * @param {string} language - Codice lingua (it, en, fr, es, de, zh)
     * @returns {string} Messaggio di errore nella lingua specificata
     */
    getErrorMessage(language) {
        return this.errorTemplates[language] || this.errorTemplates.it;
    }
    
    /**
     * Ottiene le sezioni del menu nella lingua specificata
     * @param {string} language - Codice lingua (it, en, fr, es, de, zh)
     * @returns {Object} Sezioni del menu nella lingua specificata
     */
    getMenuSections(language) {
        return this.menuSections[language] || this.menuSections.it;
    }
    
    /**
     * Sostituisce le sezioni del menu nella risposta con la versione localizzata
     * @param {string} response - Risposta originale
     * @param {string} language - Codice lingua (it, en, fr, es, de, zh)
     * @returns {string} Risposta con sezioni menu localizzate
     */
    localizeMenuSections(response, language) {
        if (language === 'it') return response; // Già in italiano
        
        const sections = this.getMenuSections(language);
        const italianSections = this.menuSections.it;
        
        let localizedResponse = response;
        
        // Sostituisci le sezioni del menu
        Object.keys(italianSections).forEach(key => {
            localizedResponse = localizedResponse.replace(
                new RegExp(italianSections[key], 'g'), 
                sections[key]
            );
        });
        
        return localizedResponse;
    }
}

module.exports = MultiLanguageHandler;