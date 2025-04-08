// src/services/mistral/linguistic-patch/CyrillicDetector.js

/**
 * Class for detecting and analyzing Cyrillic text
 */
class CyrillicDetector {
    constructor() {
        // Cyrillic regex pattern for detection
        this.cyrillicRegex = /[\u0400-\u04FF]/;
        
        // Map for transliteration from Cyrillic to Latin
        this.transliterationMap = {
            // Russian uppercase and lowercase
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
    }
    
    /**
     * Check if text contains Cyrillic characters
     * @param {string} text - Text to check
     * @returns {boolean} - True if contains Cyrillic characters
     */
    hasCyrillicChars(text) {
        if (!text) return false;
        return this.cyrillicRegex.test(text);
    }
    
    /**
     * Count Cyrillic characters in text
     * @param {string} text - Text to analyze
     * @returns {number} - Number of Cyrillic characters
     */
    countCyrillicChars(text) {
        if (!text) return 0;
        return (text.match(this.cyrillicRegex) || []).length;
    }
    
    /**
     * Force Russian detection if there are Cyrillic characters
     * @param {string} text - Text to analyze
     * @returns {object} - Analysis result
     */
    forceRussianDetection(text) {
        if (!text) return { isRussian: false, cyrillicCount: 0, forceDetection: false };
        
        const cyrillicCount = this.countCyrillicChars(text);
        const totalChars = text.replace(/\s+/g, '').length; // Exclude spaces
        
        // If at least 5% of characters are Cyrillic, consider the text Russian
        // Lower threshold to make detection more sensitive
        const cyrillicRatio = totalChars > 0 ? cyrillicCount / totalChars : 0;
        const isRussian = cyrillicCount > 0 && cyrillicRatio >= 0.05; // 5% instead of 10%
        
        return {
            isRussian,
            cyrillicCount,
            cyrillicRatio,
            totalChars,
            forceDetection: isRussian
        };
    }
    
    /**
     * Transliterate Cyrillic text to Latin
     * @param {string} text - Text to transliterate
     * @returns {string} - Transliterated text
     */
    transliterateCyrillic(text) {
        if (!text) return '';
        
        return Array.from(text).map(char => {
            return this.transliterationMap[char] || char;
        }).join('');
    }
}

module.exports = CyrillicDetector;