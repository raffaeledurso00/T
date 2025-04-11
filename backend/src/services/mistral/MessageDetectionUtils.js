// src/services/mistral/MessageDetectionUtils.js

class MessageDetectionUtils {
    // Verifica se il messaggio dell'utente è un saluto semplice
    isSimpleGreeting(message) {
        if (!message || typeof message !== 'string') return false;
        
        const simpleGreetings = ['ciao', 'buongiorno', 'buonasera', 'salve', 'hey', 'hi', 'hello', 'hola'];
        const normalizedMessage = message.toLowerCase().trim();
        
        // Rimuovi punteggiatura, emoticon e caratteri speciali per un confronto più accurato
        const cleanedMessage = normalizedMessage.replace(/[.,!?;:'"+\-_=(){}\[\]\/*&^%$#@~`|<>\d]+/g, '').trim();
        
        // Controlla se il messaggio è un saluto semplice o un saluto con 1-2 parole aggiuntive
        return simpleGreetings.some(greeting => 
            cleanedMessage === greeting || 
            cleanedMessage.startsWith(greeting + ' ') || 
            cleanedMessage.endsWith(' ' + greeting)
        ) && cleanedMessage.split(/\s+/).length <= 3;
    }

    // Verifica se il messaggio dell'utente richiede una risposta formattata
    requiresFormattedResponse(message) {
        // Se è un saluto semplice, non richiedere formattazione
        if (this.isSimpleGreeting(message)) {
            return false;
        }
        
        const lowerMessage = message.toLowerCase().trim();
        
        // Messaggi brevi che non contengono richieste specifiche non richiedono formattazione
        if (lowerMessage.length < 15 && !this.containsSpecificQuery(lowerMessage)) {
            return false;
        }
        
        // Verifica se il messaggio contiene richieste specifiche
        return this.isAboutMenu(lowerMessage) || 
               this.isAboutActivities(lowerMessage) || 
               this.isAboutEvents(lowerMessage);
    }
    
    // Verifica se il messaggio contiene una richiesta specifica (non solo un saluto)
    containsSpecificQuery(message) {
        const queryWords = ['cosa', 'quali', 'come', 'dove', 'quando', 'perché', 'chi', 'vorrei', 'posso', 'mi', 'informazioni'];
        return queryWords.some(word => message.includes(word));
    }
    
    // Verifica se il messaggio è relativo al menu/ristorante
    isAboutMenu(message) {
        const menuKeywords = ['menu', 'ristorante', 'mangiare', 'cena', 'pranzo', 'colazione', 'piatti', 'cucina'];
        
        // Chinese keywords for restaurant
        const chineseMenuKeywords = ['菜单', '餐厅', '餐馆', '吃饭', '晚餐', '午餐', '早餐', '菜', '饭', '厨师', '食物', '营业时间'];
        
        // Russian keywords for restaurant
        const russianMenuKeywords = ['меню', 'ресторан', 'ужин', 'обед', 'завтрак', 'питание', 'еда', 'кухня'];
        
        // Japanese keywords for restaurant
        const japaneseMenuKeywords = ['メニュー', 'レストラン', '食事', '夕食', '昼食', '朝食', '料理'];
        
        const allKeywords = [...menuKeywords, ...chineseMenuKeywords, ...russianMenuKeywords, ...japaneseMenuKeywords];
        return allKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad attività
    isAboutActivities(message) {
        const activityKeywords = ['attività', 'fare', 'escursion', 'visita', 'tour', 'passeggiata'];
        
        // Chinese keywords for activities
        const chineseActivityKeywords = ['活动', '做什么', '旅游', '观光', '参观', '游览', '散步', '健身'];
        
        // Russian keywords for activities
        const russianActivityKeywords = ['занятие', 'активность', 'экскурсия', 'посещение', 'тур', 'прогулка'];
        
        // Japanese keywords for activities
        const japaneseActivityKeywords = ['アクティビティ', '活動', '遊ぶ', '旅行', '観光', 'ツアー', '散歩'];
        
        const allKeywords = [...activityKeywords, ...chineseActivityKeywords, ...russianActivityKeywords, ...japaneseActivityKeywords];
        return allKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo ad eventi
    isAboutEvents(message) {
        const eventKeywords = ['eventi', 'spettacol', 'concerto', 'programma', 'festival', 'manifestazioni'];
        
        // Chinese keywords for events
        const chineseEventKeywords = ['活动', '演出', '音乐会', '表演', '项目', '节目表', '度假康乐', '节日', '周末', '娱乐'];
        
        // Russian keywords for events
        const russianEventKeywords = ['события', 'мероприятия', 'спектакль', 'концерт', 'программа', 'фестиваль'];
        
        // Japanese keywords for events
        const japaneseEventKeywords = ['イベント', '行事', '公演', 'コンサート', 'プログラム', 'フェスティバル'];
        
        const allKeywords = [...eventKeywords, ...chineseEventKeywords, ...russianEventKeywords, ...japaneseEventKeywords];
        return allKeywords.some(keyword => message.includes(keyword));
    }
    
    // Verifica se il messaggio è relativo a prenotazioni ristorante
    isRestaurantBookingRequest(message) {
        const bookingKeywords = [
            'prenota', 'tavolo', 'ristorante', 'cena', 'pranzo', 
            'prenotare', 'riservare', 'posto'
        ];
        
        const lowerMsg = message.toLowerCase();
        return bookingKeywords.some(keyword => lowerMsg.includes(keyword));
    }

    // Metodo per verificare se la risposta contiene più elementi (lista)
    containsMultipleItems(text) {
        // Verifichiamo la presenza di elenchi puntati o numerati
        const bulletPoints = (text.match(/[-•*]/g) || []).length >= 2;
        const numberedList = (text.match(/\d+\.\s+/g) || []).length >= 2;
        
        // Verifichiamo la presenza di frasi brevi separate da punti
        const shortSentences = text.split('.').filter(s => s.trim().length > 0 && s.trim().length < 100).length > 3;
        
        // Verifichiamo la presenza di virgole che potrebbero separare elementi di una lista
        const commaList = text.split(',').length > 4;
        
        return bulletPoints || numberedList || shortSentences || commaList;
    }

    // Metodi per rilevare tipi di portate, attività ed eventi
    detectCourseType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    detectActivityType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    detectEventType(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    // Verifica se una frase è correlata a determinate parole chiave
    isSentenceRelatedTo(sentence, keywords) {
        const lowerSentence = sentence.toLowerCase();
        return keywords.some(keyword => lowerSentence.includes(keyword));
    }
    
    // Estrae l'orario da un messaggio
    extractTime(message) {
        // Pattern per orari in formato 24 ore (es. 19:30, 19.30, 19,30)
        const timePattern24h = /\b([0-9]|0[0-9]|1[0-9]|2[0-3])[:.,]([0-5][0-9])\b/g;
        
        // Pattern per orari con indicazione AM/PM
        const timePatternAMPM = /\b(1[0-2]|0?[1-9])[:.,]([0-5][0-9])?\s*(am|pm)\b/gi;
        
        // Pattern per orari interi (es. "alle 20", "alle 8")
        const timePatternSimple = /\b(alle|ore|per le)\s+([0-9]|0[0-9]|1[0-9]|2[0-3])\b/gi;
        
        let matches = [];
        let match;
        
        // Cerca orari in formato 24h
        while ((match = timePattern24h.exec(message)) !== null) {
            matches.push({
                hour: parseInt(match[1], 10),
                minute: parseInt(match[2], 10),
                format: '24h'
            });
        }
        
        // Cerca orari con AM/PM
        while ((match = timePatternAMPM.exec(message)) !== null) {
            let hour = parseInt(match[1], 10);
            const minute = match[2] ? parseInt(match[2], 10) : 0;
            const period = match[3].toLowerCase();
            
            // Converti in formato 24 ore
            if (period === 'pm' && hour < 12) {
                hour += 12;
            } else if (period === 'am' && hour === 12) {
                hour = 0;
            }
            
            matches.push({
                hour,
                minute,
                format: 'AMPM'
            });
        }
        
        // Cerca orari semplici
        while ((match = timePatternSimple.exec(message)) !== null) {
            matches.push({
                hour: parseInt(match[2], 10),
                minute: 0,
                format: 'simple'
            });
        }
        
        return matches;
    }
    
    // Estrae il numero di persone da un messaggio
    extractPersonCount(message) {
        // Pattern per numero di persone (es. "2 persone", "tavolo per 4")
        const personPattern = /\b(\d+)\s*(person[ae]|ospiti|persone|tavolo per)\b/i;
        const tablePattern = /\b(tavolo|prenotazione)(\s+per)?\s+(\d+)\b/i;
        
        let match = message.match(personPattern);
        if (match && match[1]) {
            return parseInt(match[1], 10);
        }
        
        match = message.match(tablePattern);
        if (match && match[3]) {
            return parseInt(match[3], 10);
        }
        
        return null;
    }
    
    // Estrae la data da un messaggio
    extractDate(message) {
        // Pattern per date in formato italiano (es. 12/05/2023, 12-05-2023, 12.05.2023)
        const datePattern = /\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4}|\d{2})\b/g;
        
        // Pattern per date testuali (es. "oggi", "domani", "dopodomani")
        const textualDatePattern = /\b(oggi|stasera|domani|dopodomani)\b/gi;
        
        let dates = [];
        let match;
        
        // Cerca date in formato numerico
        while ((match = datePattern.exec(message)) !== null) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-based
            let year = parseInt(match[3], 10);
            
            // Gestisci anno a 2 cifre
            if (year < 100) {
                year += 2000;
            }
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                dates.push(date);
            }
        }
        
        // Cerca date testuali
        const today = new Date();
        while ((match = textualDatePattern.exec(message)) !== null) {
            const textDate = match[1].toLowerCase();
            
            if (textDate === 'oggi' || textDate === 'stasera') {
                dates.push(new Date(today));
            } else if (textDate === 'domani') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dates.push(tomorrow);
            } else if (textDate === 'dopodomani') {
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                dates.push(dayAfterTomorrow);
            }
        }
        
        return dates;
    }
}

// Esporta la classe correttamente
module.exports = MessageDetectionUtils;