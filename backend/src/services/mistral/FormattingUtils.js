// src/services/mistral/FormattingUtils.js
const MessageDetectionUtils = require('./MessageDetectionUtils');

class FormattingUtils {
    constructor() {
        this.messageDetection = new MessageDetectionUtils();
    }

    // Metodo per formattare la risposta come un menu
    formatMenuResponse(text, hasAntipasti, hasPrimi, hasSecondi, hasDolci) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let antipasti = [];
        let primi = [];
        let secondi = [];
        let dolci = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasAntipasti && this.messageDetection.isSentenceRelatedTo(s, ['antipast', 'starter', 'appetizer', 'bruschett', 'carpacci'])) {
                antipasti.push(sentenceText);
            } else if (hasPrimi && this.messageDetection.isSentenceRelatedTo(s, ['prim', 'pasta', 'risott', 'zupp', 'gnocchi', 'lasagn'])) {
                primi.push(sentenceText);
            } else if (hasSecondi && this.messageDetection.isSentenceRelatedTo(s, ['second', 'carne', 'pesce', 'main course', 'bistecca', 'filetto'])) {
                secondi.push(sentenceText);
            } else if (hasDolci && this.messageDetection.isSentenceRelatedTo(s, ['dolc', 'dessert', 'pasticceria', 'torta', 'gelato'])) {
                dolci.push(sentenceText);
            } else {
                // Se la frase è breve e contiene un nome di piatto, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasAntipasti && antipasti.length < 2) antipasti.push(sentenceText);
                    else if (hasPrimi && primi.length < 2) primi.push(sentenceText);
                    else if (hasSecondi && secondi.length < 2) secondi.push(sentenceText);
                    else if (hasDolci && dolci.length < 2) dolci.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasAntipasti && antipasti.length > 0) {
            formattedResponse += 'ANTIPASTI:\n' + antipasti.join('\n') + '\n\n';
        }
        
        if (hasPrimi && primi.length > 0) {
            formattedResponse += 'PRIMI:\n' + primi.join('\n') + '\n\n';
        }
        
        if (hasSecondi && secondi.length > 0) {
            formattedResponse += 'SECONDI:\n' + secondi.join('\n') + '\n\n';
        }
        
        if (hasDolci && dolci.length > 0) {
            formattedResponse += 'DOLCI:\n' + dolci.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }

    // Metodo per formattare la risposta come una lista di attività
    formatActivityResponse(text, hasInterne, hasEsterne, hasEscursioni) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let interne = [];
        let esterne = [];
        let escursioni = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasInterne && this.messageDetection.isSentenceRelatedTo(s, ['intern', 'nella villa', 'all\'interno', 'piscina', 'spa'])) {
                interne.push(sentenceText);
            } else if (hasEsterne && this.messageDetection.isSentenceRelatedTo(s, ['estern', 'fuori', 'nei dintorni', 'giardino', 'terrazza'])) {
                esterne.push(sentenceText);
            } else if (hasEscursioni && this.messageDetection.isSentenceRelatedTo(s, ['escursion', 'tour', 'visita guidata', 'gita'])) {
                escursioni.push(sentenceText);
            } else {
                // Se la frase è breve e sembra un'attività, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasInterne && interne.length < 2) interne.push(sentenceText);
                    else if (hasEsterne && esterne.length < 2) esterne.push(sentenceText);
                    else if (hasEscursioni && escursioni.length < 2) escursioni.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasInterne && interne.length > 0) {
            formattedResponse += 'INTERNE:\n' + interne.join('\n') + '\n\n';
        }
        
        if (hasEsterne && esterne.length > 0) {
            formattedResponse += 'ESTERNE:\n' + esterne.join('\n') + '\n\n';
        }
        
        if (hasEscursioni && escursioni.length > 0) {
            formattedResponse += 'ESCURSIONI:\n' + escursioni.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }

    // Metodo per formattare la risposta come una lista di eventi
    formatEventResponse(text, hasSpeciali, hasSettimanali, hasStagionali) {
        // Divide il testo in paragrafi o frasi
        const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
        let sentences = [];
        paragraphs.forEach(para => {
            sentences = sentences.concat(para.split(/\.\s+/).filter(s => s.trim().length > 0));
        });
        
        // Inizializza le sezioni
        let speciali = [];
        let settimanali = [];
        let stagionali = [];
        let altri = []; // Per frasi che non rientrano in nessuna categoria
        
        // Distribuisci le frasi nelle sezioni appropriate
        sentences.forEach(sentence => {
            const s = sentence.trim();
            let sentenceText = s;
            if (!sentenceText.endsWith('.')) sentenceText += '.';
            
            // Controlla in quale categoria rientra la frase
            if (hasSpeciali && this.messageDetection.isSentenceRelatedTo(s, ['special', 'unic', 'esclusiv', 'event'])) {
                speciali.push(sentenceText);
            } else if (hasSettimanali && this.messageDetection.isSentenceRelatedTo(s, ['settiman', 'ogni settimana', 'ricorrente', 'ogni'])) {
                settimanali.push(sentenceText);
            } else if (hasStagionali && this.messageDetection.isSentenceRelatedTo(s, ['stagional', 'estiv', 'invernal', 'autunnal', 'primaver'])) {
                stagionali.push(sentenceText);
            } else {
                // Se la frase è breve e sembra un evento, prova a indovinare la categoria
                if (s.length < 100) {
                    if (hasSpeciali && speciali.length < 2) speciali.push(sentenceText);
                    else if (hasSettimanali && settimanali.length < 2) settimanali.push(sentenceText);
                    else if (hasStagionali && stagionali.length < 2) stagionali.push(sentenceText);
                    else altri.push(sentenceText);
                } else {
                    altri.push(sentenceText);
                }
            }
        });
        
        // Costruisci la risposta formattata
        let formattedResponse = '';
        
        // Aggiungi le sezioni solo se hanno contenuto
        if (hasSpeciali && speciali.length > 0) {
            formattedResponse += 'SPECIALI:\n' + speciali.join('\n') + '\n\n';
        }
        
        if (hasSettimanali && settimanali.length > 0) {
            formattedResponse += 'SETTIMANALI:\n' + settimanali.join('\n') + '\n\n';
        }
        
        if (hasStagionali && stagionali.length > 0) {
            formattedResponse += 'STAGIONALI:\n' + stagionali.join('\n') + '\n\n';
        }
        
        // Aggiungi il resto del testo
        if (altri.length > 0) {
            formattedResponse += altri.join(' ');
        }
        
        return formattedResponse.trim();
    }
}

// Esporta la classe correttamente
module.exports = FormattingUtils;