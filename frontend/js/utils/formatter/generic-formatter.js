// frontend/js/utils/formatter/generic-formatter.js
// Gestione della formattazione generica per altri tipi di contenuto

class GenericFormatter extends BaseFormatter {
    constructor() {
        super();
    }
    
    /**
     * Formatta una sezione generica
     * @param {string} content - Contenuto della sezione
     * @returns {string} HTML formattato della sezione
     */
    formatGenericSection(content) {
        // Dividi il testo in elementi separati
        const rawItems = this.splitGenericText(content);
        const items = [];
        
        // Per ogni elemento, estrai le informazioni
        rawItems.forEach(rawItem => {
            // Pulisci il testo
            const itemText = rawItem.trim();
            
            // Salta elementi vuoti, troppo brevi o che sembrano domande
            if (itemText.length < 3 || this.isConclusion(itemText) || this.looksLikeQuestion(itemText)) {
                return;
            }
            
            // Analizza l'elemento
            const item = this.parseGenericItem(itemText);
            if (item && item.name) {
                items.push(item);
            }
        });
        
        // Genera l'HTML per ciascun elemento
        const itemsHtml = items.map(item => `
            <li class="list-item generic-item">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    ${item.value ? `<div class="item-price">${item.value}</div>` : ''}
                </div>
                ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
            </li>
        `).join('');
        
        return `<ul class="formatted-list generic-list">${itemsHtml}</ul>`;
    }
    
    /**
     * Divide il testo generico in elementi separati
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di elementi individuali
     */
    splitGenericText(text) {
        // Strategia 1: Dividi per punti o punti e virgola
        const byPeriodOrSemicolon = text.split(/[.;](?=\s|$)/).filter(item => item.trim());
        if (byPeriodOrSemicolon.length > 1) {
            return byPeriodOrSemicolon;
        }
        
        // Strategia 2: Cerca virgole seguite da lettere maiuscole
        const commaCapitalSplit = text.split(/,\s*(?=[A-Z])/).filter(item => item.trim());
        if (commaCapitalSplit.length > 1) {
            return commaCapitalSplit;
        }
        
        // Se tutto fallisce, considera l'intero testo come un solo elemento
        return [text];
    }
    
    /**
     * Analizza un elemento generico per estrarre nome, descrizione e valore
     * @param {string} text - Testo dell'elemento
     * @returns {Object} Oggetto con nome, descrizione e valore
     */
    parseGenericItem(text) {
        const item = {
            name: text.trim(),
            description: '',
            value: ''
        };
        
        // Estrai valore numerico
        const valueMatch = item.name.match(/(\d+(?:[.,]\d+)?)/);
        if (valueMatch) {
            item.value = valueMatch[1];
        }
        
        // Estrai descrizione tra parentesi
        const descMatch = item.name.match(/\(([^)]+)\)/);
        if (descMatch) {
            item.description = descMatch[1].trim();
            item.name = item.name.replace(/\s*\([^)]+\)/, '').trim();
        }
        
        // Cerca descrizioni dopo virgola
        if (!item.description && item.name.includes(',')) {
            const parts = item.name.split(',');
            item.name = parts[0].trim();
            item.description = parts.slice(1).join(',').trim();
        }
        
        // Pulizia finale
        item.name = this.cleanText(item.name);
        item.description = this.cleanText(item.description);
        
        return item;
    }
}

// Esporta la classe GenericFormatter
if (typeof module !== 'undefined') {
    module.exports = GenericFormatter;
} else {
    window.GenericFormatter = GenericFormatter;
}