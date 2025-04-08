// src/services/mistral/linguistic-patch/TranslationUtils.js

/**
 * Utilities for translation and fallback handling
 */
class TranslationUtils {
    constructor() {
        // Simple translation dictionary for common words and phrases
        this.simpleDictionary = {
            it: {
                'hello': 'ciao',
                'good morning': 'buongiorno',
                'good evening': 'buonasera',
                'how can I help you': 'come posso aiutarti',
                'welcome': 'benvenuto',
                'sorry': 'mi dispiace',
                'thank you': 'grazie',
                'yes': 'sì',
                'no': 'no',
                'please': 'per favore',
                'restaurant': 'ristorante',
                'menu': 'menu',
                'activities': 'attività',
                'services': 'servizi',
                'events': 'eventi',
                'booking': 'prenotazione',
                'reservation': 'prenotazione',
                'spa': 'spa',
                'pool': 'piscina',
                'breakfast': 'colazione',
                'lunch': 'pranzo',
                'dinner': 'cena',
                'price': 'prezzo',
                'hours': 'orari',
                'open': 'aperto',
                'closed': 'chiuso'
            },
            fr: {
                'hello': 'bonjour',
                'good morning': 'bonjour',
                'good evening': 'bonsoir',
                'how can I help you': 'comment puis-je vous aider',
                'welcome': 'bienvenue',
                'sorry': 'désolé',
                'thank you': 'merci',
                'yes': 'oui',
                'no': 'non',
                'please': 's\'il vous plaît',
                'restaurant': 'restaurant',
                'menu': 'menu',
                'activities': 'activités',
                'services': 'services',
                'events': 'événements',
                'booking': 'réservation',
                'reservation': 'réservation',
                'spa': 'spa',
                'pool': 'piscine',
                'breakfast': 'petit déjeuner',
                'lunch': 'déjeuner',
                'dinner': 'dîner',
                'price': 'prix',
                'hours': 'horaires',
                'open': 'ouvert',
                'closed': 'fermé'
            },
            es: {
                'hello': 'hola',
                'good morning': 'buenos días',
                'good evening': 'buenas noches',
                'how can I help you': 'cómo puedo ayudarte',
                'welcome': 'bienvenido',
                'sorry': 'lo siento',
                'thank you': 'gracias',
                'yes': 'sí',
                'no': 'no',
                'please': 'por favor',
                'restaurant': 'restaurante',
                'menu': 'menú',
                'activities': 'actividades',
                'services': 'servicios',
                'events': 'eventos',
                'booking': 'reserva',
                'reservation': 'reserva',
                'spa': 'spa',
                'pool': 'piscina',
                'breakfast': 'desayuno',
                'lunch': 'almuerzo',
                'dinner': 'cena',
                'price': 'precio',
                'hours': 'horarios',
                'open': 'abierto',
                'closed': 'cerrado'
            },
            de: {
                'hello': 'hallo',
                'good morning': 'guten Morgen',
                'good evening': 'guten Abend',
                'how can I help you': 'wie kann ich Ihnen helfen',
                'welcome': 'willkommen',
                'sorry': 'entschuldigung',
                'thank you': 'danke',
                'yes': 'ja',
                'no': 'nein',
                'please': 'bitte',
                'restaurant': 'Restaurant',
                'menu': 'Speisekarte',
                'activities': 'Aktivitäten',
                'services': 'Dienstleistungen',
                'events': 'Veranstaltungen',
                'booking': 'Buchung',
                'reservation': 'Reservierung',
                'spa': 'Spa',
                'pool': 'Schwimmbad',
                'breakfast': 'Frühstück',
                'lunch': 'Mittagessen',
                'dinner': 'Abendessen',
                'price': 'Preis',
                'hours': 'Öffnungszeiten',
                'open': 'geöffnet',
                'closed': 'geschlossen'
            },
            ru: {
                'hello': 'привет',
                'good morning': 'доброе утро',
                'good evening': 'добрый вечер',
                'how can I help you': 'чем я могу вам помочь',
                'welcome': 'добро пожаловать',
                'sorry': 'извините',
                'thank you': 'спасибо',
                'yes': 'да',
                'no': 'нет',
                'please': 'пожалуйста',
                'restaurant': 'ресторан',
                'menu': 'меню',
                'activities': 'мероприятия',
                'services': 'услуги',
                'events': 'события',
                'booking': 'бронирование',
                'reservation': 'бронирование',
                'spa': 'спа',
                'pool': 'бассейн',
                'breakfast': 'завтрак',
                'lunch': 'обед',
                'dinner': 'ужин',
                'price': 'цена',
                'hours': 'часы работы',
                'open': 'открыто',
                'closed': 'закрыто'
            }
        };
    }
    
    /**
     * Simple dictionary-based translation
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language code
     * @returns {string} - Translated text (best effort)
     */
    simpleDictionaryTranslate(text, targetLanguage) {
        if (!text || !targetLanguage || !this.simpleDictionary[targetLanguage]) {
            return text;
        }
        
        const dictionary = this.simpleDictionary[targetLanguage];
        let translatedText = text.toLowerCase();
        
        // Replace words and phrases from the dictionary
        Object.keys(dictionary).forEach(word => {
            const regex = new RegExp('\\b' + word + '\\b', 'gi');
            translatedText = translatedText.replace(regex, dictionary[word]);
        });
        
        return translatedText;
    }
    
    /**
     * Translate with fallback mechanisms
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language
     * @returns {string} - Translated text
     */
    async translateWithFallback(text, targetLanguage) {
        if (!text || !targetLanguage) {
            return text;
        }
        
        try {
            // First try with simple dictionary translation
            const translatedText = this.simpleDictionaryTranslate(text, targetLanguage);
            
            // TODO: In a real implementation, this could try to call an actual translation API
            
            // If no translation happened, return a fallback message
            if (translatedText === text) {
                const fallbackMessages = {
                    it: "Mi scusi, non riesco a fornire tutte le informazioni in italiano. Posso assisterla in inglese?",
                    fr: "Je suis désolé, je ne peux pas fournir toutes les informations en français. Puis-je vous aider en anglais?",
                    es: "Lo siento, no puedo proporcionar toda la información en español. ¿Puedo ayudarte en inglés?",
                    de: "Es tut mir leid, ich kann nicht alle Informationen auf Deutsch bereitstellen. Kann ich Ihnen auf Englisch helfen?",
                    ru: "Извините, я не могу предоставить всю информацию на русском языке. Могу ли я помочь вам на английском?",
                    // Add more languages as needed
                };
                
                return fallbackMessages[targetLanguage] || text;
            }
            
            return translatedText;
        } catch (error) {
            console.error('[TranslationUtils] Translation error:', error);
            return text; // Return original text if translation fails
        }
    }
    
    /**
     * Replace section titles with localized versions
     * @param {string} text - Text with section titles
     * @param {string} language - Target language
     * @param {Object} sectionMap - Map of section titles by language
     * @returns {string} - Text with localized section titles
     */
    localizeSections(text, language, sectionMap) {
        if (!text || !language || !sectionMap || !sectionMap[language]) {
            return text;
        }
        
        const sections = sectionMap[language];
        let localizedText = text;
        
        // Replace section titles with localized versions
        Object.keys(sections).forEach(key => {
            const italianSection = sectionMap.it[key];
            const localizedSection = sections[key];
            
            // Replace the Italian section title with the localized version
            const regex = new RegExp(italianSection, 'g');
            localizedText = localizedText.replace(regex, localizedSection);
        });
        
        return localizedText;
    }
}

module.exports = TranslationUtils;