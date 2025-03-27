// frontend/js/utils/formatter/menu-formatter.js
// Gestione della formattazione del menu

class MenuFormatter extends BaseFormatter {
    constructor() {
        super();
    }
    
    /**
     * Formatta una sezione del menu
     * @param {string} content - Contenuto della sezione del menu
     * @returns {string} HTML formattato della sezione
     */
    formatMenuSection(content) {
        // Dividiamo il testo in singoli piatti candidati
        const rawItems = this.splitMenuText(content);
        const menuItems = [];
        
        // Per ogni elemento, estrai nome, descrizione e prezzo
        rawItems.forEach(rawItem => {
            // Pulisci il testo
            const itemText = rawItem.trim();
            
            // Salta elementi vuoti, troppo brevi o che sembrano domande
            if (itemText.length < 3 || this.isConclusion(itemText) || this.looksLikeQuestion(itemText)) {
                return;
            }
            
            // Analizza il piatto
            const dish = this.parseMenuDish(itemText);
            if (dish && dish.name) {
                menuItems.push(dish);
            }
        });
        
        // Genera l'HTML per ciascun piatto
        const menuHtml = menuItems.map(item => `
            <li class="list-item menu-item">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    ${item.price ? `<div class="item-price">${item.price}</div>` : ''}
                </div>
                ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
            </li>
        `).join('');
        
        return `<ul class="formatted-list menu-list">${menuHtml}</ul>`;
    }
    
    /**
     * Divide il testo del menu in piatti individuali
     * @param {string} text - Testo del menu
     * @returns {Array<string>} Array di piatti individuali
     */
    splitMenuText(text) {
        // Strategia 1: Dividi per punti (migliore se i piatti sono separati da periodi)
        const byPeriod = text.split(/\.(?=\s|$)/).filter(item => item.trim());
        if (byPeriod.length > 1) {
            return byPeriod;
        }
        
        // Strategia 2: Se c'è un solo elemento, prova a dividere per virgole e prezzi
        return this.splitTextByDishPatterns(text);
    }
    
    /**
     * Divide il testo in base a pattern tipici dei piatti (prezzi, virgole con maiuscole)
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di piatti individuali
     */
    splitTextByDishPatterns(text) {
        const result = [];
        let currentPosition = 0;
        
        // Cerca tutti i prezzi nel testo
        const priceMatches = Array.from(text.matchAll(/€\s*\d+(?:[.,]\d+)?(?:\/\w+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro/gi));
        
        if (priceMatches.length > 1) {
            // Usa i prezzi come delimitatori di piatti
            for (let i = 0; i < priceMatches.length; i++) {
                const priceMatch = priceMatches[i];
                const pricePosition = priceMatch.index;
                
                // Se non è il primo prezzo, estrai il piatto precedente
                if (i > 0) {
                    // Cerca l'inizio del piatto corrente (prima lettera maiuscola dopo il prezzo precedente)
                    const prevPriceEnd = priceMatches[i-1].index + priceMatches[i-1][0].length;
                    const textBetween = text.substring(prevPriceEnd, pricePosition);
                    
                    // Cerca una lettera maiuscola dopo uno spazio o all'inizio
                    const capitaMatch = textBetween.match(/(?:^|\s+|,\s*)([A-Z][a-zàèìòù]+)/);
                    if (capitaMatch) {
                        const dishStart = prevPriceEnd + textBetween.indexOf(capitaMatch[1]);
                        // Estrai il piatto completo con il suo prezzo
                        const dishText = text.substring(dishStart, pricePosition + priceMatch[0].length);
                        result.push(dishText.trim());
                    } else {
                        // Se non troviamo una maiuscola, prendi tutto il testo tra i prezzi
                        result.push(text.substring(prevPriceEnd, pricePosition + priceMatch[0].length).trim());
                    }
                } else {
                    // Per il primo prezzo, prendi tutto dall'inizio fino al prezzo incluso
                    result.push(text.substring(0, pricePosition + priceMatch[0].length).trim());
                }
                
                // Aggiorna la posizione corrente
                currentPosition = pricePosition + priceMatch[0].length;
            }
            
            // Aggiungi il testo rimanente se ce n'è
            if (currentPosition < text.length) {
                result.push(text.substring(currentPosition).trim());
            }
            
            return result.filter(item => item.length > 0);
        }
        
        // Se non ci sono prezzi multipli, cerca maiuscole dopo virgole
        const commaSplit = text.split(/,\s*(?=[A-Z])/).filter(item => item.trim());
        if (commaSplit.length > 1) {
            return commaSplit;
        }
        
        // Se tutto fallisce, considera l'intero testo come un solo elemento
        return [text];
    }
    
    /**
     * Analizza un singolo piatto per estrarre nome, descrizione e prezzo
     * @param {string} text - Testo del piatto
     * @returns {Object} Oggetto con nome, descrizione e prezzo
     */
    parseMenuDish(text) {
        const dish = {
            name: text.trim(),
            description: '',
            price: ''
        };
        
        // Estrai prezzo
        const priceMatch = dish.name.match(/€\s*\d+(?:[.,]\d+)?(?:\/\w+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro/i);
        if (priceMatch) {
            // Normalizza il prezzo
            const priceText = priceMatch[0];
            
            if (priceText.match(/\d+\s*euro/i)) {
                dish.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else if (priceText.match(/\d+\s*€/)) {
                dish.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else {
                dish.price = priceText.replace(/\s+/g, '');
            }
            
            // Gestione speciale per /etto
            if (priceText.includes('/')) {
                const perUnit = priceText.match(/\/\w+/);
                if (perUnit) {
                    dish.price = dish.price.replace(/\/\w+/, '') + perUnit[0];
                }
            }
            
            // Rimuovi il prezzo dal nome
            dish.name = dish.name.replace(priceMatch[0], '').trim();
        }
        
        // Estrai descrizione tra parentesi
        const descMatches = dish.name.match(/\(([^)]+)\)/g);
        if (descMatches && descMatches.length > 0) {
            // Prendi il contenuto di tutte le parentesi e uniscile
            const descriptionParts = descMatches.map(match => {
                return match.substring(1, match.length - 1).trim();
            });
            
            dish.description = descriptionParts.join('. ');
            
            // Rimuovi tutte le parentesi dal nome
            descMatches.forEach(match => {
                dish.name = dish.name.replace(match, '').trim();
            });
        }
        
        // Cerca descrizioni dopo virgola, solo se non abbiamo già una descrizione
        if (!dish.description && dish.name.includes(',')) {
            const parts = dish.name.split(',');
            
            // Il primo elemento è il nome, il resto è la descrizione
            dish.name = parts[0].trim();
            dish.description = parts.slice(1).join(',').trim();
        }
        
        // Se non abbiamo trovato un prezzo, cerchiamo numeri seguiti da € o euro
        if (!dish.price) {
            const altPriceMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro|EUR)/i);
            if (altPriceMatch) {
                dish.price = '€' + altPriceMatch[1];
            }
        }
        
        // Pulizia finale
        dish.name = this.cleanText(dish.name);
        dish.description = this.cleanText(dish.description);
        
        return dish;
    }
}

// Esporta la classe MenuFormatter
if (typeof module !== 'undefined') {
    module.exports = MenuFormatter;
} else {
    window.MenuFormatter = MenuFormatter;
}