// frontend/js/utils/formatter/event-formatter.js
// Gestione della formattazione degli eventi

class EventFormatter extends BaseFormatter {
    constructor() {
        super();
    }
    
    /**
     * Formatta una sezione di eventi
     * @param {string} content - Contenuto della sezione
     * @returns {string} HTML formattato della sezione
     */
    formatEventSection(content) {
        // Dividi il testo in eventi separati
        const rawItems = this.splitEventText(content);
        const events = [];
        
        // Per ogni elemento, estrai le informazioni
        rawItems.forEach(rawItem => {
            // Pulisci il testo
            const itemText = rawItem.trim();
            
            // Salta elementi vuoti, troppo brevi o che sembrano domande
            if (itemText.length < 3 || this.isConclusion(itemText) || this.looksLikeQuestion(itemText)) {
                return;
            }
            
            // Analizza l'evento
            const event = this.parseEvent(itemText);
            if (event && event.name) {
                events.push(event);
            }
        });
        
        // Genera l'HTML per ciascun evento
        const eventsHtml = events.map(item => `
            <li class="list-item eventi-item">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    ${item.price ? `<div class="item-price">${item.price}</div>` : ''}
                </div>
                ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
                ${item.date ? `<div class="item-date">${item.date}</div>` : ''}
            </li>
        `).join('');
        
        return `<ul class="formatted-list eventi-list">${eventsHtml}</ul>`;
    }
    
    /**
     * Divide il testo degli eventi in elementi separati
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di eventi individuali
     */
    splitEventText(text) {
        // Strategia 1: Dividi per punti o punti e virgola
        const byPeriodOrSemicolon = text.split(/[.;](?=\s|$)/).filter(item => item.trim());
        if (byPeriodOrSemicolon.length > 1) {
            return byPeriodOrSemicolon;
        }
        
        // Strategia 2: Cerca date specifiche per eventi
        return this.splitByEventPatterns(text);
    }
    
    /**
     * Divide il testo in base a pattern di eventi (date, giorni, virgole con maiuscole)
     * @param {string} text - Testo da dividere
     * @returns {Array<string>} Array di eventi individuali
     */
    splitByEventPatterns(text) {
        // Definisci i pattern di date
        const datePatterns = [
            /\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/gi,
            /\d{1,2}\s+(?:gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/gi,
            /(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)(?:\s+e\s+(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica))*/gi
        ];
        
        // Cerca le occorrenze di date nel testo
        let dateMatches = [];
        for (const pattern of datePatterns) {
            const matches = Array.from(text.matchAll(pattern));
            dateMatches = [...dateMatches, ...matches];
        }
        
        // Ordina le occorrenze per posizione
        dateMatches.sort((a, b) => a.index - b.index);
        
        if (dateMatches.length > 0) {
            const events = [];
            
            // Usa le date come delimitatori di eventi
            for (let i = 0; i < dateMatches.length; i++) {
                const dateMatch = dateMatches[i];
                const datePosition = dateMatch.index;
                
                // Cerca indietro per trovare l'inizio dell'evento
                const textBefore = text.substring(0, datePosition);
                
                // Cerca l'ultima maiuscola preceduta da punto, virgola o inizio testo
                let eventStart = 0;
                const capitaBeforeMatch = textBefore.match(/(?:^|[.,]\s+)([A-Z][a-zàèìòù]+)[^.,]*$/);
                if (capitaBeforeMatch) {
                    eventStart = textBefore.lastIndexOf(capitaBeforeMatch[1]);
                }
                
                // Trova la fine dell'evento (prossima data o fine testo)
                let eventEnd = text.length;
                let hasNextDate = false;
                let nextDatePos = -1;
                
                if (i < dateMatches.length - 1) {
                    // Cerca l'inizio del prossimo evento
                    nextDatePos = dateMatches[i+1].index;
                    hasNextDate = true;
                    const textBetween = text.substring(datePosition + dateMatch[0].length, nextDatePos);
                    
                    // Cerca una lettera maiuscola dopo uno spazio o virgola
                    const capitaAfterMatch = textBetween.match(/(?:^|\s+|,\s*)([A-Z][a-zàèìòù]+)/);
                    if (capitaAfterMatch) {
                        eventEnd = datePosition + dateMatch[0].length + textBetween.indexOf(capitaAfterMatch[1]);
                    }
                }
                
                // Estrai l'evento
                events.push(text.substring(eventStart, eventEnd).trim());
                
                // Se abbiamo trovato l'inizio del prossimo evento e non è la data stessa, passiamo direttamente ad esso
                if (hasNextDate && eventEnd < text.length && eventEnd !== nextDatePos) {
                    i = i+1;
                }
            }
            
            // Se abbiamo trovato almeno un evento, torniamolo
            if (events.length > 0) {
                return events;
            }
        }
        
        // Strategia 3: Cerca virgole seguite da lettere maiuscole
        const commaCapitalSplit = text.split(/,\s*(?=[A-Z])/).filter(item => item.trim());
        if (commaCapitalSplit.length > 1) {
            return commaCapitalSplit;
        }
        
        // Se tutto fallisce, considera l'intero testo come un solo evento
        return [text];
    }
    
    /**
     * Analizza un singolo evento per estrarre nome, descrizione, data e prezzo
     * @param {string} text - Testo dell'evento
     * @returns {Object} Oggetto con nome, descrizione, data e prezzo
     */
    parseEvent(text) {
        const event = {
            name: text.trim(),
            description: '',
            date: '',
            price: ''
        };
        
        // Miglioramento dell'estrazione del prezzo
        const priceMatches = text.match(/(?:€\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*€|\d+(?:[.,]\d+)?\s*euro)/gi);
        if (priceMatches && priceMatches.length > 0) {
            // Prendi il primo prezzo trovato
            const priceText = priceMatches[0];
            
            if (priceText.match(/\d+\s*euro/i)) {
                event.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else if (priceText.match(/\d+\s*€/)) {
                event.price = '€' + priceText.match(/\d+(?:[.,]\d+)?/)[0];
            } else {
                event.price = priceText.replace(/\s+/g, '');
            }
            
            // Rimuovi il prezzo dal nome (tutti i prezzi trovati)
            priceMatches.forEach(match => {
                event.name = event.name.replace(match, '').trim();
            });
        }
        
        // Cerca prezzi alternativi se non ne abbiamo trovato uno
        if (!event.price) {
            // Cerca pattern come "costa 25 euro" o "prezzo di 30€"
            const pricePhraseMatch = event.name.match(/(?:costa|prezzo|costo)[^\d]*(\d+(?:[.,]\d+)?)/i);
            if (pricePhraseMatch) {
                event.price = '€' + pricePhraseMatch[1];
                
                // Rimuovi la frase del prezzo dal nome
                const pricePhrase = event.name.substring(
                    event.name.indexOf(pricePhraseMatch[0]), 
                    event.name.indexOf(pricePhraseMatch[0]) + pricePhraseMatch[0].length
                );
                event.name = event.name.replace(pricePhrase, '').trim();
            }
        }
        
        // Estrai date con pattern specifici
        const datePatterns = [
            {
                regex: /(\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))/i,
                extract: match => match[1].trim()
            },
            {
                regex: /(\d{1,2}\s+(?:gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic))/i,
                extract: match => match[1].trim()
            },
            {
                regex: /((?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)(?:\s+e\s+(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica))*)/i,
                extract: match => match[1].trim()
            },
            {
                regex: /((?:lun|mar|mer|gio|ven|sab|dom)(?:\s+e\s+(?:lun|mar|mer|gio|ven|sab|dom))*)/i,
                extract: match => match[1].trim()
            },
            {
                regex: /(\d{1,2}\s*-\s*\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))/i,
                extract: match => match[1].trim()
            },
            {
                regex: /(\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s*-\s*\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre))/i,
                extract: match => match[1].trim()
            }
        ];
        
        // Cerca le date nel testo
        let dateText = '';
        
        for (const pattern of datePatterns) {
            const match = event.name.match(pattern.regex);
            if (match) {
                const dateValue = pattern.extract(match);
                if (dateText) {
                    dateText += ', ' + dateValue;
                } else {
                    dateText = dateValue;
                }
                
                event.name = event.name.replace(match[0], '').trim();
            }
        }
        
        // Imposta la data se trovata
        if (dateText) {
            event.date = dateText;
        }
        
        // Estrai descrizione tra parentesi
        const descMatch = event.name.match(/\(([^)]+)\)/);
        if (descMatch) {
            event.description = descMatch[1].trim();
            event.name = event.name.replace(/\s*\([^)]+\)/, '').trim();
        }
        
        // Cerca descrizioni dopo virgola
        if (!event.description && event.name.includes(',')) {
            const parts = event.name.split(',');
            
            // Il primo elemento è il nome, il resto potrebbe essere descrizione o data
            event.name = parts[0].trim();
            const afterComma = parts.slice(1).join(',').trim();
            
            // Verifica se il testo dopo la virgola contiene una data
            let containsDate = false;
            for (const pattern of datePatterns) {
                const match = afterComma.match(pattern.regex);
                if (match) {
                    const dateValue = pattern.extract(match);
                    if (event.date) {
                        event.date += ', ' + dateValue;
                    } else {
                        event.date = dateValue;
                    }
                    
                    // Il resto diventa descrizione
                    const restDesc = afterComma.replace(match[0], '').trim();
                    if (restDesc && !event.description) {
                        event.description = restDesc;
                    }
                    
                    containsDate = true;
                    break;
                }
            }
            
            // Se non contiene data, è una descrizione
            if (!containsDate && !event.description) {
                event.description = afterComma;
            }
        }
        
        // Controllo specifico per "15 aprile" e "22 aprile" che potrebbero essere stati persi
        if (!event.date) {
            const specificDateMatch = text.match(/(\d{1,2}\s+aprile)/i);
            if (specificDateMatch) {
                event.date = specificDateMatch[1].trim();
            }
        }
        
        // Controllo specifico per "lunedì, mercoledì, venerdì" e "venerdì e sabato"
        if (!event.date) {
            const weekdaysMatch = text.match(/((?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)(?:\s*,\s*|\s+e\s+)(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)(?:\s*,\s*|\s+e\s+)?(?:lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)?)/i);
            if (weekdaysMatch) {
                event.date = weekdaysMatch[1].trim();
            }
        }
        
        // Assicurati che il prezzo sia nel formato corretto
        if (event.price && !event.price.startsWith('€')) {
            event.price = '€' + event.price.replace(/[^\d,.]/g, '');
        }
        
        // Pulizia finale
        event.name = this.cleanText(event.name);
        event.description = this.cleanText(event.description);
        
        return event;
    }
}

// Esporta la classe EventFormatter
if (typeof module !== 'undefined') {
    module.exports = EventFormatter;
} else {
    window.EventFormatter = EventFormatter;
}