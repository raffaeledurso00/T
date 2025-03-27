// frontend/js/utils/formatter/base-formatter.js
// Classe di base per il formatter e utilities comuni

class BaseFormatter {
    constructor() {
        // Pattern per riconoscere le sezioni nel testo
        this.sectionPatterns = [
            // Pattern per il Menu
            {
                type: 'menu',
                patterns: [
                    /ANTIPASTI:(.+?)(?=PRIMI:|SECONDI:|DOLCI:|$)/is,
                    /PRIMI:(.+?)(?=ANTIPASTI:|SECONDI:|DOLCI:|$)/is,
                    /SECONDI:(.+?)(?=ANTIPASTI:|PRIMI:|DOLCI:|$)/is,
                    /DOLCI:(.+?)(?=ANTIPASTI:|PRIMI:|SECONDI:|$)/is
                ]
            },
            // Pattern per Attività
            {
                type: 'attivita',
                patterns: [
                    /INTERNE:(.+?)(?=ESTERNE:|ESCURSIONI:|$)/is,
                    /ESTERNE:(.+?)(?=INTERNE:|ESCURSIONI:|$)/is,
                    /ESCURSIONI:(.+?)(?=INTERNE:|ESTERNE:|$)/is
                ]
            },
            // Pattern per Eventi
            {
                type: 'eventi',
                patterns: [
                    /SPECIALI:(.+?)(?=SETTIMANALI:|STAGIONALI:|$)/is,
                    /SETTIMANALI:(.+?)(?=SPECIALI:|STAGIONALI:|$)/is,
                    /STAGIONALI:(.+?)(?=SPECIALI:|SETTIMANALI:|$)/is
                ]
            }
        ];
        
        // Pattern per frasi di conclusione che non dovrebbero essere incluse nelle liste
        this.conclusionPatterns = [
            /desidera\s+(?:altre|ulteriori)?\s*informazioni/i,
            /vorrebbe\s+prenotare/i,
            /(?:posso|le\s+serve|ha\s+bisogno)\s+(?:di\s+)?(?:aiutarla|altro)/i,
            /(?:c'è|c'|ci)\s+(?:altro|qualcos'altro)\s+(?:che\s+)?(?:le\s+)?(?:interessa|serve)/i,
            /(?:vuole|desidera)\s+(?:sapere|conoscere)\s+altro/i,
            /quale (?:preferisce|le interessa)/i,
            /posso prenotarlo/i,
            /le interessa qualcuna/i
        ];
    }
    
    /**
     * Verifica se una stringa è una frase conclusiva
     */
    isConclusion(text) {
        if (!text) return false;
        
        return this.conclusionPatterns.some(pattern => pattern.test(text));
    }
    
    /**
     * Verifica se una stringa sembra una domanda
     */
    looksLikeQuestion(text) {
        if (!text) return false;
        
        // Controlla se contiene punto interrogativo
        if (text.includes('?')) return true;
        
        // Controlla parole tipiche di domande
        const questionWords = ['quanto', 'come', 'dove', 'quando', 'perché', 'chi', 'cosa', 'quale'];
        for (const word of questionWords) {
            if (text.toLowerCase().trim().startsWith(word)) return true;
        }
        
        return false;
    }
    
    /**
     * Pulisce il testo rimuovendo caratteri problematici
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/^\s*-\s*/, '') // Rimuovi trattini iniziali
            .replace(/\(\s*\)/, '') // Rimuovi parentesi vuote
            .replace(/\s{2,}/g, ' ') // Riduci spazi multipli a uno solo
            .replace(/\.$/, '') // Rimuovi punto finale
            .replace(/^,\s*/, '') // Rimuovi virgola iniziale
            .replace(/\s*,\s*$/, '') // Rimuovi virgola finale
            .trim();
    }
}

// Esporta la classe di base
if (typeof module !== 'undefined') {
    module.exports = BaseFormatter;
} else {
    window.BaseFormatter = BaseFormatter;
}