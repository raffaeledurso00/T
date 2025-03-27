// frontend/js/utils/formatter/text-utils.js
// Utilities per la manipolazione del testo

const TextUtils = {
    /**
     * Estrae informazioni dal testo in base a pattern comuni
     * @param {string} text - Il testo da analizzare
     * @param {RegExp} pattern - Il pattern per l'estrazione
     * @param {Function} transformer - Funzione opzionale per trasformare il risultato
     * @returns {string|null} Il testo estratto o null se non trovato
     */
    extract(text, pattern, transformer = null) {
        if (!text || !pattern) return null;
        
        const match = text.match(pattern);
        if (!match) return null;
        
        const extracted = match[1] || match[0];
        return transformer ? transformer(extracted) : extracted.trim();
    },
    
    /**
     * Estrae prezzo normalizzato dal testo
     * @param {string} text - Testo da cui estrarre il prezzo
     * @returns {string|null} Prezzo normalizzato (es. €10) o null se non trovato
     */
    extractPrice(text) {
        if (!text) return null;
        
        // Pattern per prezzi in vari formati
        const priceMatch = text.match(/€\s*\d+(?:[.,]\d+)?(?:\/\w+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro/i);
        
        if (!priceMatch) return null;
        
        const priceText = priceMatch[0];
        let normalizedPrice = '';
        
        // Normalizza il formato
        if (priceText.match(/\d+\s*euro/i)) {
            normalizedPrice = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
        } else if (priceText.match(/\d+\s*€/)) {
            normalizedPrice = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
        } else {
            normalizedPrice = priceText.replace(/\s+/g, '');
        }
        
        // Gestione speciale per /etto
        if (priceText.includes('/')) {
            const perUnit = priceText.match(/\/\w+/);
            if (perUnit) {
                normalizedPrice = normalizedPrice.replace(/\/\w+/, '') + perUnit[0];
            }
        }
        
        return normalizedPrice;
    },
    
    /**
     * Estrae descrizione tra parentesi
     * @param {string} text - Testo da cui estrarre la descrizione
     * @returns {object} Oggetto con descrizione e testo senza parentesi
     */
    extractParenthesisDescription(text) {
        if (!text) return { description: '', cleanText: text };
        
        const result = {
            description: '',
            cleanText: text
        };
        
        const descMatches = text.match(/\(([^)]+)\)/g);
        if (descMatches && descMatches.length > 0) {
            // Prendi il contenuto di tutte le parentesi e uniscile
            const descriptionParts = descMatches.map(match => {
                return match.substring(1, match.length - 1).trim();
            });
            
            result.description = descriptionParts.join('. ');
            
            // Rimuovi tutte le parentesi dal testo
            let cleanText = text;
            descMatches.forEach(match => {
                cleanText = cleanText.replace(match, '').trim();
            });
            
            result.cleanText = cleanText;
        }
        
        return result;
    },
    
    /**
     * Estrae descrizione dopo la virgola
     * @param {string} text - Testo da cui estrarre la descrizione
     * @returns {object} Oggetto con nome e descrizione
     */
    extractCommaDescription(text) {
        if (!text || !text.includes(',')) {
            return { name: text, description: '' };
        }
        
        const parts = text.split(',');
        return {
            name: parts[0].trim(),
            description: parts.slice(1).join(',').trim()
        };
    },
    
    /**
     * Trova gli indici di inizio e fine delle sezioni nel testo
     * @param {string} text - Testo completo
     * @param {RegExp} pattern - Pattern della sezione
     * @returns {Array} Array di oggetti con indici di inizio e fine
     */
    findSectionBoundaries(text, pattern) {
        if (!text || !pattern) return [];
        
        const matches = Array.from(text.matchAll(new RegExp(pattern, 'gi')));
        return matches.map(match => ({
            start: match.index,
            end: match.index + match[0].length,
            content: match[0]
        }));
    },
    
    /**
     * Sostituisce una sezione di testo con contenuto formattato
     * @param {string} text - Testo completo
     * @param {RegExp} pattern - Pattern da sostituire
     * @param {string} type - Tipo di sezione ('menu', 'attivita', ecc.)
     * @param {string} formatted - Contenuto formattato
     * @returns {string} Testo con la sezione sostituita
     */
    replaceSection(text, pattern, type, formatted) {
        if (!text || !pattern) return text;
        
        const match = text.match(pattern);
        if (!match || !match[0]) return text;
        
        const sectionTitle = match[0].split(':')[0] + ':';
        
        return text.replace(
            pattern, 
            `<div class="formatted-section ${type}-section">
                <div class="section-title">${sectionTitle}</div>
                ${formatted}
            </div>`
        );
    }
};

// Esporta l'oggetto TextUtils
if (typeof module !== 'undefined') {
    module.exports = TextUtils;
} else {
    window.TextUtils = TextUtils;
}