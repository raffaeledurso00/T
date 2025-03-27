// frontend/js/utils/formatter/activity-formatter.js
// Gestione della formattazione delle attività

class ActivityFormatter extends BaseFormatter {
    constructor() {
        super();
    }
    
    /**
     * Formatta una sezione di attività
     * @param {string} content - Contenuto della sezione
     * @returns {string} HTML formattato della sezione
     */
    formatActivitySection(content) {
        // Dividi il testo in attività separate
        const rawItems = this.splitActivityText(content);
        const activities = [];
        
        // Per ogni elemento, estrai le informazioni
        rawItems.forEach(rawItem => {
            // Pulisci il testo
            const itemText = rawItem.trim();
            
            // Salta elementi vuoti, troppo brevi o che sembrano domande
            if (itemText.length < 3 || this.isConclusion(itemText) || this.looksLikeQuestion(itemText)) {
                return;
            }
            
            // Analizza l'attività
            const activity = this.parseActivity(itemText);
            if (activity && activity.name) {
                activities.push(activity);
            }
        });
        
        // Genera l'HTML per ciascuna attività
        const activitiesHtml = activities.map(item => `
            <li class="list-item attivita-item">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    ${item.price ? `<div class="item-price">${item.price}</div>` : ''}
                </div>
                ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
                ${item.duration ? `<div class="item-date">${item.duration}</div>` : ''}
            </li>
        `).join('');
        
        return `<ul class="formatted-list attivita-list">${activitiesHtml}</ul>`;
    }
    
    /**
     * Divide il testo delle attività in elementi separati
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di attività individuali
     */
    splitActivityText(text) {
        // Strategia 1: Dividi per punti o punti e virgola
        const byPeriodOrSemicolon = text.split(/[.;](?=\s|$)/).filter(item => item.trim());
        if (byPeriodOrSemicolon.length > 1) {
            return byPeriodOrSemicolon;
        }
        
        // Strategia 2: Cerca pattern di attività specifici
        return this.splitByActivityPatterns(text);
    }
    
    /**
     * Divide il testo in base a pattern di attività (durate, prezzi, virgole con maiuscole)
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di attività individuali
     */
    splitByActivityPatterns(text) {
        // Pattern per durate
        const durationMatches = Array.from(text.matchAll(/\d+\s*or[ae]|giornalier[ao]|accesso\s+giornaliero/gi));
        
        // Pattern per prezzi
        const priceMatches = Array.from(text.matchAll(/€\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro/gi));
        
        // Se abbiamo sia durate che prezzi, possiamo usarli per dividere
        const markers = [...durationMatches, ...priceMatches].sort((a, b) => a.index - b.index);
        
        if (markers.length > 1) {
            const activities = [];
            
            // Segmenta il testo sulla base dei marker trovati
            for (let i = 0; i < markers.length; i++) {
                const markerPos = markers[i].index;
                
                // Se non è il primo marker, cerca l'inizio dell'attività
                if (i > 0) {
                    const prevMarkerEnd = markers[i-1].index + markers[i-1][0].length;
                    
                    // Cerca una lettera maiuscola dopo uno spazio o una virgola
                    const textBetween = text.substring(prevMarkerEnd, markerPos);
                    const capitaMatch = textBetween.match(/(?:^|\s+|,\s*)([A-Z][a-zàèìòù]+)/);
                    
                    if (capitaMatch) {
                        const activityStart = prevMarkerEnd + textBetween.indexOf(capitaMatch[1]);
                        activities.push(text.substring(activityStart, text.length).trim());
                        break;  // Abbiamo trovato l'inizio della nuova attività
                    }
                }
                
                // Per il primo marker, o se non troviamo un inizio chiaro
                if (i === 0) {
                    // Cerca indietro dal marker per trovare l'inizio dell'attività
                    let activityStart = 0;
                    const textBefore = text.substring(0, markerPos);
                    
                    // Cerca l'ultima maiuscola preceduta da punto, virgola o inizio testo
                    const capitaBeforeMatch = textBefore.match(/(?:^|[.,]\s+)([A-Z][a-zàèìòù]+)[^.,]*$/);
                    if (capitaBeforeMatch) {
                        activityStart = textBefore.lastIndexOf(capitaBeforeMatch[1]);
                    }
                    
                    activities.push(text.substring(activityStart, text.length).trim());
                    break;  // Abbiamo l'intera stringa da questo punto
                }
            }
            
            // Se abbiamo trovato almeno un'attività, torniamola
            if (activities.length > 0) {
                return activities;
            }
        }
        
        // Strategia 3: Cerca virgole seguite da lettere maiuscole
        const commaCapitalSplit = text.split(/,\s*(?=[A-Z])/).filter(item => item.trim());
        if (commaCapitalSplit.length > 1) {
            return commaCapitalSplit;
        }
        
        // Se tutto fallisce, considera l'intero testo come una sola attività
        return [text];
    }
    
    /**
     * Analizza una singola attività per estrarre nome, descrizione, durata e prezzo
     * @param {string} text - Testo dell'attività
     * @returns {Object} Oggetto con nome, descrizione, durata e prezzo
     */
    parseActivity(text) {
        const activity = {
            name: text.trim(),
            description: '',
            duration: '',
            price: ''
        };
        
        // Estrai prezzo
        const priceMatches = text.match(/(?:€\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro)/gi);
        if (priceMatches && priceMatches.length > 0) {
            // Prendi il primo prezzo trovato
            const priceText = priceMatches[0];
            
            if (priceText.match(/\d+\s*euro/i)) {
                activity.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else if (priceText.match(/\d+\s*€/)) {
                activity.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else {
                activity.price = priceText.replace(/\s+/g, '');
            }
            
            // Rimuovi tutti i prezzi dal nome
            priceMatches.forEach(match => {
                activity.name = activity.name.replace(match, '').trim();
            });
        }
        
        // Cerca prezzi alternativi come ultimo tentativo
        if (!activity.price) {
            const altPriceMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro|EUR)/i);
            if (altPriceMatch) {
                activity.price = '€' + altPriceMatch[1];
            }
        }
        
        // Estrai durata
        const durationPatterns = [
            /(\d+\s*or[ae])/i,
            /(accesso\s+giornaliero)/i,
            /(giornalier[ao])/i,
            /(mezz[a']?\s+giornata)/i,
            /(giornata\s+intera)/i
        ];
        
        for (const pattern of durationPatterns) {
            const match = activity.name.match(pattern);
            if (match) {
                activity.duration = match[1].trim();
                activity.name = activity.name.replace(match[0], '').trim();
                break;
            }
        }
        
        // Se la durata non è stata trovata nel nome, cercala nella parte rimanente
        if (!activity.duration) {
            // Cerca nella descrizione in parentesi o dopo virgole
            const restOfText = activity.name;
            
            for (const pattern of durationPatterns) {
                const match = restOfText.match(pattern);
                if (match) {
                    activity.duration = match[1].trim();
                    // Non rimuoviamo la durata dal testo perché estrarremo comunque la descrizione
                    break;
                }
            }
        }
        
        // Gestione migliorata delle parentesi per la descrizione
        const descMatches = activity.name.match(/\(([^)]+)\)/g);
        if (descMatches && descMatches.length > 0) {
            // Prendi il contenuto di tutte le parentesi e uniscile
            const descriptionParts = descMatches.map(match => {
                return match.substring(1, match.length - 1).trim();
            });
            
            activity.description = descriptionParts.join('. ');
            
            // Rimuovi tutte le parentesi dal nome
            descMatches.forEach(match => {
                activity.name = activity.name.replace(match, '').trim();
            });
        }
        
        // Cerca descrizioni dopo virgola
        if (!activity.description && activity.name.includes(',')) {
            const parts = activity.name.split(',');
            
            // Il primo elemento è il nome, il resto potrebbe essere descrizione o durata
            activity.name = parts[0].trim();
            const afterComma = parts.slice(1).join(',').trim();
            
            // Verifica se il testo dopo la virgola contiene una durata
            let containsDuration = false;
            for (const pattern of durationPatterns) {
                const match = afterComma.match(pattern);
                if (match) {
                    if (!activity.duration) {
                        activity.duration = match[1].trim();
                    }
                    
                    // Il resto diventa descrizione
                    const restDesc = afterComma.replace(match[0], '').trim();
                    if (restDesc && !activity.description) {
                        activity.description = restDesc;
                    }
                    
                    containsDuration = true;
                    break;
                }
            }
            
            // Se non contiene durata, è una descrizione
            if (!containsDuration && !activity.description) {
                activity.description = afterComma;
            }
        }
        
        // Pulizia finale
        activity.name = this.cleanText(activity.name);
        activity.description = this.cleanText(activity.description);
        
        return activity;
    }
}

// Esporta la classe ActivityFormatter
if (typeof module !== 'undefined') {
    module.exports = ActivityFormatter;
} else {
    window.ActivityFormatter = ActivityFormatter;
}