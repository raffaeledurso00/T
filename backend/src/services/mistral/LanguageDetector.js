// src/services/mistral/LanguageDetector.js
// Utility per rilevare la lingua di un messaggio

class LanguageDetector {
    constructor() {
        // Definisci le parole chiave per le lingue più comuni
        this.languageKeywords = {
            it: ['ciao', 'buongiorno', 'buonasera', 'salve', 'grazie', 'piacere', 'come', 'dove', 'quando', 'perché', 'cosa', 'chi', 'quale', 'quanto', 'vorrei', 'posso', 'voglio', 'prenotare', 'informazioni'],
            en: ['hello', 'hi', 'good', 'morning', 'evening', 'thanks', 'thank', 'please', 'how', 'where', 'when', 'why', 'what', 'who', 'which', 'would', 'can', 'could', 'book', 'reservation', 'information'],
            fr: ['bonjour', 'salut', 'merci', 'plaisir', 'comment', 'où', 'quand', 'pourquoi', 'quoi', 'qui', 'quel', 'combien', 'voudrais', 'peux', 'veux', 'réserver', 'informations'],
            es: ['hola', 'buenos', 'gracias', 'placer', 'cómo', 'dónde', 'cuándo', 'por qué', 'qué', 'quién', 'cuál', 'cuánto', 'quisiera', 'puedo', 'quiero', 'reservar', 'información'],
            de: ['hallo', 'guten', 'danke', 'bitte', 'wie', 'wo', 'wann', 'warum', 'was', 'wer', 'welche', 'wieviel', 'möchte', 'kann', 'will', 'reservieren', 'information'],
            zh: ['你好', '早上好', '谢谢', '请', '如何', '哪里', '什么时候', '为什么', '什么', '谁', '哪个', '多少', '想要', '可以', '要', '预订', '信息']
        };
        
        // Punteggi di default per ogni lingua (in caso di testo troppo breve)
        this.defaultLanguageScores = {
            it: 10,  // Favorisci l'italiano come default
            en: 5,
            fr: 1,
            es: 1,
            de: 1,
            zh: 1
        };
    }
    
    /**
     * Rileva la lingua di un testo
     * @param {string} text - Il testo da analizzare
     * @returns {string} - Il codice della lingua rilevata
     */
    detect(text) {
        if (!text || text.trim().length === 0) {
            return 'it'; // Default a italiano se il testo è vuoto
        }
        
        const normalizedText = text.toLowerCase().trim();
        
        // Per testi molto brevi, rileva in base a parole chiave specifiche
        if (normalizedText.length < 10) {
            return this.detectShortText(normalizedText);
        }
        
        // Inizializza i punteggi per ogni lingua
        const scores = {...this.defaultLanguageScores};
        
        // Elabora il testo e calcola i punteggi
        Object.keys(this.languageKeywords).forEach(lang => {
            const keywords = this.languageKeywords[lang];
            
            // Calcola quante parole chiave della lingua sono presenti nel testo
            keywords.forEach(keyword => {
                if (normalizedText.includes(keyword)) {
                    scores[lang] += 2;
                }
            });
            
            // Controlla caratteri specifici per alcune lingue
            if (lang === 'zh' && /[\u4e00-\u9fff]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri cinesi
            }
            
            // Controlla pattern di caratteri tipici di alcune lingue
            if (lang === 'it' && /[àèéìòù]/i.test(normalizedText)) {
                scores[lang] += 3; // Accenti italiani
            }
            if (lang === 'fr' && /[àâçéèêëîïôùûüÿ]/i.test(normalizedText)) {
                scores[lang] += 3; // Accenti francesi
            }
            if (lang === 'es' && /[áéíóúüñ]/i.test(normalizedText)) {
                scores[lang] += 3; // Accenti e ñ spagnoli
            }
            if (lang === 'de' && /[äöüß]/i.test(normalizedText)) {
                scores[lang] += 3; // Umlaut e ß tedeschi
            }
        });
        
        // Determina la lingua con il punteggio più alto
        let detectedLang = 'it'; // Default a italiano
        let maxScore = scores['it'];
        
        Object.keys(scores).forEach(lang => {
            if (scores[lang] > maxScore) {
                maxScore = scores[lang];
                detectedLang = lang;
            }
        });
        
        return detectedLang;
    }
    
    /**
     * Rileva la lingua di un testo molto breve
     * @param {string} text - Il testo breve da analizzare
     * @returns {string} - Il codice della lingua rilevata
     */
    detectShortText(text) {
        // Controlla saluti o parole comuni specifiche
        const greetings = {
            it: ['ciao', 'salve', 'ehi'],
            en: ['hi', 'hello', 'hey'],
            fr: ['salut', 'bonjour'],
            es: ['hola', 'buenos'],
            de: ['hallo', 'guten'],
            zh: ['你好', '嗨']
        };
        
        for (const [lang, words] of Object.entries(greetings)) {
            if (words.some(word => text === word || text.startsWith(word + ' '))) {
                return lang;
            }
        }
        
        // Controllo per il cinese
        if (/[\u4e00-\u9fff]/.test(text)) {
            return 'zh';
        }
        
        // Default a italiano se non rilevato
        return 'it';
    }
}

module.exports = LanguageDetector;