// src/services/mistral/linguistic-patch.js
// Script per risolvere il problema specifico del rilevamento del russo

class LinguisticPatcher {
    constructor() {
        // Mappa delle traslitterazioni comuni
        this.transliterationMap = {
            // Russo maiuscole e minuscole
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO', 'Ж': 'ZH',
            'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
            'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS',
            'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU',
            'Я': 'YA',
            
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
            'я': 'ya'
        };
        
        // Espressione regolare per rilevare caratteri cirillici
        this.cyrillicRegex = /[\u0400-\u04FF]/;
    }
    
    /**
     * Verifica se un testo contiene caratteri cirillici
     * @param {string} text - Il testo da verificare
     * @returns {boolean} - True se contiene caratteri cirillici
     */
    hasCyrillicChars(text) {
        if (!text) return false;
        return this.cyrillicRegex.test(text);
    }
    
    /**
     * Conta quanti caratteri cirillici ci sono in un testo
     * @param {string} text - Il testo da analizzare
     * @returns {number} - Il numero di caratteri cirillici
     */
    countCyrillicChars(text) {
        if (!text) return 0;
        return (text.match(this.cyrillicRegex) || []).length;
    }
    
    /**
     * Forza il rilevamento per il russo se ci sono caratteri cirillici
     * @param {string} text - Il testo da analizzare
     * @returns {object} - Risultato dell'analisi
     */
    forceRussianDetection(text) {
        if (!text) return { isRussian: false, cyrillicCount: 0, forceDetection: false };
        
        const cyrillicCount = this.countCyrillicChars(text);
        const totalChars = text.replace(/\s+/g, '').length; // Escludi spazi
        
        // Se almeno il 10% dei caratteri è cirillico, consideriamo il testo russo
        const cyrillicRatio = totalChars > 0 ? cyrillicCount / totalChars : 0;
        const isRussian = cyrillicCount > 0 && cyrillicRatio >= 0.1;
        
        return {
            isRussian,
            cyrillicCount,
            cyrillicRatio,
            totalChars,
            forceDetection: isRussian
        };
    }
    
    /**
     * Traslittera il testo cirillico in caratteri latini
     * @param {string} text - Il testo da traslitterare
     * @returns {string} - Il testo traslitterato
     */
    transliterateCyrillic(text) {
        if (!text) return '';
        
        return Array.from(text).map(char => {
            return this.transliterationMap[char] || char;
        }).join('');
    }
    
    /**
     * Patch per il rilevamento della lingua russa
     * @param {string} text - Testo da analizzare
     * @param {function} detectFn - Funzione originale di rilevamento
     * @returns {string} - Codice lingua rilevato
     */
    patchLanguageDetection(text, detectFn) {
        if (!text) return 'it'; // Default
        
        // Verifica iniziale per caratteri cirillici
        const russianAnalysis = this.forceRussianDetection(text);
        console.log('[LinguisticPatcher] Analisi russo:', russianAnalysis);
        
        // Se ci sono abbastanza caratteri cirillici, forza il russo
        if (russianAnalysis.forceDetection) {
            console.log('[LinguisticPatcher] ATTIVATO PATCH RUSSO: testo forzato a russo per presenza di caratteri cirillici');
            return 'ru';
        }
        
        // Altrimenti, procedi con il rilevamento normale
        return detectFn(text);
    }
    
    /**
     * Verifica se una risposta rispetta la lingua richiesta
     * @param {string} response - La risposta da verificare
     * @param {string} targetLanguage - La lingua obiettivo
     * @returns {boolean} - True se la risposta è nella lingua corretta
     */
    isResponseInCorrectLanguage(response, targetLanguage) {
        if (!response || !targetLanguage) return false;
        
        // Per il russo, verifica la presenza di caratteri cirillici
        if (targetLanguage === 'ru') {
            const russianAnalysis = this.forceRussianDetection(response);
            // Considera valida se almeno il 15% dei caratteri è cirillico
            return russianAnalysis.cyrillicRatio >= 0.15;
        }
        
        // Per altre lingue, potremmo aggiungere altre verifiche
        return true;
    }
}

module.exports = new LinguisticPatcher();