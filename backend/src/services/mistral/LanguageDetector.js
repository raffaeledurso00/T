// src/services/mistral/LanguageDetector.js
// Utility per rilevare la lingua di un messaggio
const linguisticPatch = require('./linguistic-patch');

class LanguageDetector {
    constructor() {
        // Definisci le parole chiave per le lingue più comuni
        this.languageKeywords = {
            it: ['ciao', 'buongiorno', 'buonasera', 'salve', 'grazie', 'piacere', 'come', 'dove', 'quando', 'perché', 'cosa', 'chi', 'quale', 'quanto', 'vorrei', 'posso', 'voglio', 'prenotare', 'informazioni'],
            en: ['hello', 'hi', 'good', 'morning', 'evening', 'thanks', 'thank', 'please', 'how', 'where', 'when', 'why', 'what', 'who', 'which', 'would', 'can', 'could', 'book', 'reservation', 'information'],
            fr: ['bonjour', 'salut', 'merci', 'plaisir', 'comment', 'où', 'quand', 'pourquoi', 'quoi', 'qui', 'quel', 'combien', 'voudrais', 'peux', 'veux', 'réserver', 'informations'],
            es: ['hola', 'buenos', 'gracias', 'placer', 'cómo', 'dónde', 'cuándo', 'por qué', 'qué', 'quién', 'cuál', 'cuánto', 'quisiera', 'puedo', 'quiero', 'reservar', 'información'],
            de: ['hallo', 'guten', 'danke', 'bitte', 'wie', 'wo', 'wann', 'warum', 'was', 'wer', 'welche', 'wieviel', 'möchte', 'kann', 'will', 'reservieren', 'information'],
            zh: ['你好', '早上好', '谢谢', '请', '如何', '哪里', '什么时候', '为什么', '什么', '谁', '哪个', '多少', '想要', '可以', '要', '预订', '信息'],
            ru: ['привет', 'здравствуйте', 'доброе', 'спасибо', 'пожалуйста', 'как', 'где', 'когда', 'почему', 'что', 'кто', 'который', 'сколько', 'хотел', 'могу', 'хочу', 'бронировать', 'информация'],
            ja: ['こんにちは', 'おはよう', 'ありがとう', 'お願い', 'どう', 'どこ', 'いつ', 'なぜ', '何', '誰', 'どの', 'いくら', 'したい', 'できる', '予約', '情報'],
            ko: ['안녕하세요', '감사합니다', '부탁합니다', '어떻게', '어디', '언제', '왜', '무엇', '누구', '어느', '얼마', '원하다', '할 수 있다', '예약', '정보'],
            ar: ['مرحبا', 'صباح الخير', 'شكرا', 'من فضلك', 'كيف', 'أين', 'متى', 'لماذا', 'ما', 'من', 'أي', 'كم', 'أريد', 'أستطيع', 'حجز', 'معلومات'],
            pt: ['olá', 'bom dia', 'obrigado', 'por favor', 'como', 'onde', 'quando', 'por que', 'o que', 'quem', 'qual', 'quanto', 'gostaria', 'posso', 'quero', 'reservar', 'informação'],
            nl: ['hallo', 'goedemorgen', 'dank', 'alstublieft', 'hoe', 'waar', 'wanneer', 'waarom', 'wat', 'wie', 'welke', 'hoeveel', 'zou willen', 'kan', 'wil', 'reserveren', 'informatie'],
            hi: ['नमस्ते', 'सुप्रभात', 'धन्यवाद', 'कृपया', 'कैसे', 'कहाँ', 'कब', 'क्यों', 'क्या', 'कौन', 'कौन सा', 'कितना', 'चाहता हूँ', 'सकता हूँ', 'चाहता हूँ', 'बुक', 'जानकारी'],
            tr: ['merhaba', 'günaydın', 'teşekkürler', 'lütfen', 'nasıl', 'nerede', 'ne zaman', 'neden', 'ne', 'kim', 'hangi', 'ne kadar', 'istiyorum', 'yapabilir', 'rezervasyon', 'bilgi'],
            pl: ['cześć', 'dzień dobry', 'dziękuję', 'proszę', 'jak', 'gdzie', 'kiedy', 'dlaczego', 'co', 'kto', 'który', 'ile', 'chciałbym', 'mogę', 'chcę', 'rezerwacja', 'informacja'],
            sv: ['hej', 'god morgon', 'tack', 'vänligen', 'hur', 'var', 'när', 'varför', 'vad', 'vem', 'vilken', 'hur mycket', 'skulle vilja', 'kan', 'vill', 'boka', 'information'],
            th: ['สวัสดี', 'ขอบคุณ', 'กรุณา', 'อย่างไร', 'ที่ไหน', 'เมื่อไหร่', 'ทำไม', 'อะไร', 'ใคร', 'อัน', 'เท่าไหร่', 'ต้องการ', 'สามารถ', 'จอง', 'ข้อมูล']
        };
        
        // Punteggi di default per ogni lingua (in caso di testo troppo breve)
        this.defaultLanguageScores = {
            it: 8,
            en: 8,
            fr: 4,
            es: 4,
            de: 4,
            zh: 4,
            ru: 4,
            ja: 4,
            ko: 4,
            ar: 4,
            pt: 4,
            nl: 4,
            hi: 4,
            tr: 4,
            pl: 4,
            sv: 4,
            th: 4
        };
    }
    
    /**
     * Rileva la lingua di un testo
     * @param {string} text - Il testo da analizzare
     * @returns {string} - Il codice della lingua rilevata
     */
    detect(text) {
        // DEBUG: Stampiamo l'input esatto che riceviamo
        console.log(`=== LANGUAGE DETECTION DEBUG ===`);
        console.log(`[LanguageDetector] Input originale (${typeof text}): '${text}'`);
        console.log(`[LanguageDetector] Lunghezza input: ${text ? text.length : 0}`);
        console.log(`[LanguageDetector] Input UNICODE caratteri:`, text ? Array.from(text).map(c => `${c}:${c.charCodeAt(0)}`).join(', ') : 'none');
        
        if (!text || text.trim().length === 0) {
            console.log('[LanguageDetector] Testo vuoto, ritorno italiano');
            return 'it'; // Default a italiano se il testo è vuoto
        }
        
        // Check if it's a restaurant hours query - these are almost always Italian
        const lowerText = text.toLowerCase();
        if (lowerText.includes('orari del ristorante') || 
            (lowerText.includes('quali sono gli orari') && lowerText.includes('ristorante')) ||
            lowerText.includes('quando apre il ristorante') || 
            (lowerText.includes('ristorante') && lowerText.includes('orari'))) {
            console.log('[LanguageDetector] Restaurant hours query detected, forcing Italian');
            return 'it';
        }
        
        // Patch per rilevamento del russo
        const russianAnalysis = linguisticPatch.forceRussianDetection(text);
        if (russianAnalysis.forceDetection) {
            console.log('[LanguageDetector] ATTIVATO PATCH RUSSO: testo contiene caratteri cirillici');
            console.log(`[LanguageDetector] Analisi: ${russianAnalysis.cyrillicCount} caratteri cirillici su ${russianAnalysis.totalChars} (${(russianAnalysis.cyrillicRatio * 100).toFixed(2)}%)`);
            return 'ru';
        }
        
        const normalizedText = text.toLowerCase().trim();
        console.log(`[LanguageDetector] Testo normalizzato: '${normalizedText}'`);
        
        // Converti testo in array di caratteri e stampa ogni carattere con il suo codice Unicode
        console.log(`[LanguageDetector] Analisi caratteri:`);
        for (let i = 0; i < Math.min(normalizedText.length, 10); i++) {
            const char = normalizedText[i];
            const code = char.charCodeAt(0);
            console.log(`  - Carattere ${i+1}: '${char}' (Unicode: ${code}, Hex: ${code.toString(16)})`);
        }
        
        // Controllo rapido per set di caratteri specifici
        const isChinese = /[\u4e00-\u9fff]/.test(normalizedText);
        const isCyrillic = /[\u0400-\u04FF]/.test(normalizedText);
        
        console.log(`[LanguageDetector] Test cinese: ${isChinese}, regexp pattern: /[\u4e00-\u9fff]/`);
        console.log(`[LanguageDetector] Test cirillico: ${isCyrillic}, regexp pattern: /[\u0400-\u04FF]/`);
        
        // Debug completo per caratteri specifici
        if (normalizedText.length > 0) {
            console.log('[LanguageDetector] Analisi dei caratteri per rilevamento cirillico:');
            for (let i = 0; i < normalizedText.length; i++) {
                const char = normalizedText[i];
                const code = char.charCodeAt(0);
                const isCyrillicChar = code >= 0x0400 && code <= 0x04FF;
                console.log(`  Char[${i}]: '${char}', Unicode: ${code}, Hex: ${code.toString(16)}, Cirillico: ${isCyrillicChar}`);
            }
        }
        
        if (isChinese) {
            console.log('[LanguageDetector] Caratteri cinesi rilevati, rispondendo in cinese');
            return 'zh';
        }
        if (isCyrillic) {
            console.log('[LanguageDetector] Caratteri cirillici rilevati, rispondendo in russo');
            return 'ru';
        }
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(normalizedText)) {
            console.log('[LanguageDetector] Caratteri giapponesi rilevati, rispondendo in giapponese');
            return 'ja';
        }
        if (/[\uAC00-\uD7A3\u1100-\u11FF]/.test(normalizedText)) {
            console.log('[LanguageDetector] Caratteri coreani rilevati, rispondendo in coreano');
            return 'ko';
        }
        if (/[\u0600-\u06FF]/.test(normalizedText)) {
            console.log('[LanguageDetector] Caratteri arabi rilevati, rispondendo in arabo');
            return 'ar';
        }
        if (/[\u0900-\u097F]/.test(normalizedText)) {
            console.log('[LanguageDetector] Caratteri hindi rilevati, rispondendo in hindi');
            return 'hi';
        }
        if (/[\u0E00-\u0E7F]/.test(normalizedText)) {
            console.log('[LanguageDetector] Caratteri thai rilevati, rispondendo in thai');
            return 'th';
        }
        
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
            if (lang === 'ru' && /[\u0400-\u04FF]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri cirillici
            }
            if (lang === 'ja' && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri giapponesi
            }
            if (lang === 'ko' && /[\uAC00-\uD7A3\u1100-\u11FF]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri coreani
            }
            if (lang === 'ar' && /[\u0600-\u06FF]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri arabi
            }
            if (lang === 'hi' && /[\u0900-\u097F]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri indiani/hindi
            }
            if (lang === 'th' && /[\u0E00-\u0E7F]/.test(normalizedText)) {
                scores[lang] += 50; // Presenza di caratteri thai
            }
            
            // Controlla pattern di caratteri tipici di alcune lingue
            if (lang === 'it' && /[àèéìòù]/i.test(normalizedText)) {
                scores[lang] += 20; // Aumentato per dare priorità all'italiano con accenti
            }
            
            // Give Italian a boost for common Italian words
            if (lang === 'it' && (/\b(sono|gli|del|quali|quando|dove|come|perché|cosa)\b/i.test(normalizedText))) {
                scores[lang] += 15; // Boost for common Italian words
            }
            if (lang === 'fr' && /[àâçéèêëîïôùûüÿ]/i.test(normalizedText)) {
                scores[lang] += 10; // Aumentato - Accenti francesi
            }
            if (lang === 'es' && /[áéíóúüñ]/i.test(normalizedText)) {
                scores[lang] += 10; // Aumentato - Accenti e ñ spagnoli
            }
            if (lang === 'de' && /[äöüß]/i.test(normalizedText)) {
                scores[lang] += 10; // Aumentato - Umlaut e ß tedeschi
            }
            if (lang === 'pt' && /[áâãàéêíóôõúüç]/i.test(normalizedText)) {
                scores[lang] += 10; // Accenti portoghesi
            }
            if (lang === 'pl' && /[ąćęłńóśźż]/i.test(normalizedText)) {
                scores[lang] += 10; // Caratteri polacchi
            }
            if (lang === 'sv' && /[åäö]/i.test(normalizedText)) {
                scores[lang] += 10; // Caratteri svedesi
            }
            if (lang === 'nl' && /\b(van|de|het)\b/i.test(normalizedText)) {
                scores[lang] += 5; // Parole comuni olandesi
            }
            if (lang === 'tr' && /[çğıöşü]/i.test(normalizedText)) {
                scores[lang] += 10; // Caratteri turchi
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
        
        console.log('[LanguageDetector] Testo:', normalizedText.substring(0, 30) + '...');
        console.log('[LanguageDetector] Punteggi lingue:', JSON.stringify(scores));
        console.log('[LanguageDetector] Lingua rilevata:', detectedLang);
        
        return detectedLang;
    }
    
    /**
     * Rileva la lingua di un testo molto breve
     * @param {string} text - Il testo breve da analizzare
     * @returns {string} - Il codice della lingua rilevata
     */
    detectShortText(text) {
        // Controllo immediato per i sistemi di scrittura non latini
        if (/[\u4e00-\u9fff]/.test(text)) { // Cinese
            console.log('[LanguageDetector] Caratteri cinesi rilevati in testo breve');
            return 'zh';
        }
        if (/[\u0400-\u04FF]/.test(text)) { // Cirillico (Russo)
            console.log('[LanguageDetector] Caratteri cirillici rilevati in testo breve');
            return 'ru';
        }
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) { // Giapponese
            console.log('[LanguageDetector] Caratteri giapponesi rilevati in testo breve');
            return 'ja';
        }
        if (/[\uAC00-\uD7A3\u1100-\u11FF]/.test(text)) { // Coreano
            console.log('[LanguageDetector] Caratteri coreani rilevati in testo breve');
            return 'ko';
        }
        if (/[\u0600-\u06FF]/.test(text)) { // Arabo
            console.log('[LanguageDetector] Caratteri arabi rilevati in testo breve');
            return 'ar';
        }
        if (/[\u0900-\u097F]/.test(text)) { // Hindi
            console.log('[LanguageDetector] Caratteri hindi rilevati in testo breve');
            return 'hi';
        }
        if (/[\u0E00-\u0E7F]/.test(text)) { // Thai
            console.log('[LanguageDetector] Caratteri thai rilevati in testo breve');
            return 'th';
        }

        // Controlla saluti o parole comuni specifiche
        const greetings = {
            it: ['ciao', 'salve', 'ehi', 'buongiorno', 'buonasera', 'hey'],
            en: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'yo'],
            fr: ['salut', 'bonjour', 'bonsoir', 'merci', 'allo'],
            es: ['hola', 'buenos', 'buenos días', 'buenas tardes', 'gracias', 'que tal'],
            de: ['hallo', 'guten', 'guten tag', 'danke', 'tag', 'morgen'],
            zh: ['你好', '嗨', '早上好', '晚上好', '謝謝', '嗨嗨'],
            ru: ['привет', 'здравствуй', 'добрый', 'спасибо'],
            ja: ['こんにちは', 'おはよう', 'こんばんは', 'ありがとう'],
            ko: ['안녕하세요', '안녕', '감사함니다'],
            ar: ['مرحبا', 'السلام عليكم', 'شكراً', 'أهلا'],
            pt: ['olá', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'oi'],
            nl: ['hallo', 'goedemorgen', 'goedemiddag', 'goedenavond', 'dank u', 'hoi', 'dag'],
            hi: ['नमस्ते', 'शुभ प्रभात', 'धन्यवाद', 'हाय'],
            tr: ['merhaba', 'günaydın', 'iyi akşamlar', 'teşekkürler', 'selam'],
            pl: ['cześć', 'dzień dobry', 'dobry wieczór', 'dziękuję', 'hej'],
            sv: ['hej', 'god morgon', 'god kväll', 'tack'],
            th: ['สวัสดี', 'ขอบคุณ', 'สบายดีไหม', 'สวัสดีตอนเช้า']
        };
        
        for (const [lang, words] of Object.entries(greetings)) {
            if (words.some(word => text === word || text.startsWith(word + ' ') || text.includes(word))) {
                console.log('[LanguageDetector] Testo breve, parola chiave trovata:', word, 'lingua:', lang);
                return lang;
            }
        }
        
        // Analisi per accenti e caratteri speciali nei testi brevi
        if (/[àèéìòù]/i.test(text)) {
            console.log('[LanguageDetector] Accenti italiani rilevati in testo breve');
            return 'it';
        }
        if (/[àâçéèêëîïôùûüÿ]/i.test(text)) {
            console.log('[LanguageDetector] Accenti francesi rilevati in testo breve');
            return 'fr';
        }
        if (/[áéíóúüñ]/i.test(text)) {
            console.log('[LanguageDetector] Accenti spagnoli rilevati in testo breve');
            return 'es';
        }
        if (/[äöüß]/i.test(text)) {
            console.log('[LanguageDetector] Caratteri tedeschi rilevati in testo breve');
            return 'de';
        }
        if (/[áâãàéêíóôõúüç]/i.test(text)) {
            console.log('[LanguageDetector] Accenti portoghesi rilevati in testo breve');
            return 'pt';
        }
        if (/[ąćęłńóśźż]/i.test(text)) {
            console.log('[LanguageDetector] Caratteri polacchi rilevati in testo breve');
            return 'pl';
        }
        if (/[åäö]/i.test(text)) {
            console.log('[LanguageDetector] Caratteri svedesi rilevati in testo breve');
            return 'sv';
        }
        if (/[çğıöşü]/i.test(text)) {
            console.log('[LanguageDetector] Caratteri turchi rilevati in testo breve');
            return 'tr';
        }
        
        console.log('[LanguageDetector] Testo breve non identificato, defaulting a italiano:', text);
        // Default a italiano se non rilevato
        return 'it';
    }
}

module.exports = LanguageDetector;