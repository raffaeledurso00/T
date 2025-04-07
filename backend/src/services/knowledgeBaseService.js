// backend/src/services/knowledgeBaseService.js
// Servizio per la gestione della knowledge base

const fs = require('fs');
const path = require('path');

class KnowledgeBaseService {
    constructor() {
        this.dataPath = path.join(__dirname, '../data');
        this.cache = {};
        this.loadAllData();
    }

    /**
     * Carica tutti i dati nella cache
     */
    loadAllData() {
        try {
            console.log('Loading knowledge base data...');
            this.cache.ristorante = this.loadDataFile('ristorante.json');
            this.cache.attivita = this.loadDataFile('attivita.json');
            this.cache.eventi = this.loadDataFile('eventi.json');
            this.cache.servizi = this.loadDataFile('servizi.json');
            console.log('Knowledge base data loaded successfully');
        } catch (error) {
            console.error('Error loading knowledge base data:', error);
        }
    }

    /**
     * Carica un file di dati
     * @param {string} fileName - Nome del file
     * @returns {Object} Dati caricati
     */
    loadDataFile(fileName) {
        try {
            const filePath = path.join(this.dataPath, fileName);
            console.log(`Loading data file: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`Data file not found: ${filePath}`);
                return {};
            }
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`Error loading data file ${fileName}:`, error);
            return {};
        }
    }

    /**
     * Ottiene tutti i dati
     * @returns {Object} Tutti i dati
     */
    getAllData() {
        return this.cache;
    }

    /**
     * Ottiene i dati di una specifica categoria
     * @param {string} category - Nome della categoria
     * @returns {Object} Dati della categoria
     */
    getCategoryData(category) {
        return this.cache[category] || {};
    }

    /**
     * Genera un prompt di sistema con tutte le informazioni pertinenti
     * @param {string} topic - Argomento della conversazione
     * @returns {string} Prompt di sistema
     */
    generateSystemPrompt(topic = null) {
        let prompt = "Sei il concierge digitale di Villa Petriolo, un'elegante struttura situata nelle colline toscane. ";
        prompt += "Il tuo compito è fornire informazioni accurate e assistenza agli ospiti. ";
        prompt += "Rispondi in modo cordiale, professionale e conciso. ";
        
        // Aggiungi informazioni specifiche in base al topic
        if (topic) {
            switch (topic) {
                case 'menu':
                case 'ristorante':
                    prompt += this.generateRestaurantPrompt();
                    break;
                case 'attivita':
                    prompt += this.generateActivitiesPrompt();
                    break;
                case 'eventi':
                    prompt += this.generateEventsPrompt();
                    break;
                case 'servizi':
                    prompt += this.generateServicesPrompt();
                    break;
                default:
                    // Includi informazioni generali
                    prompt += this.generateGeneralPrompt();
            }
        } else {
            // Includi informazioni generali
            prompt += this.generateGeneralPrompt();
        }
        
        prompt += "\\n\\nRicorda di essere sempre preciso nelle tue risposte e di fornire solo informazioni verificate.";
        
        return prompt;
    }

    /**
     * Genera un prompt con informazioni sul ristorante
     * @returns {string} Prompt sul ristorante
     */
    generateRestaurantPrompt() {
        const ristorante = this.cache.ristorante;
        if (!ristorante || Object.keys(ristorante).length === 0) {
            return "Mi dispiace, non ho informazioni sul ristorante al momento.";
        }
        
        let prompt = "\\n\\nEcco le informazioni sul nostro ristorante:\\n";
        
        // Orari
        if (ristorante.orari) {
            prompt += `\\nORARI:\\n`;
            prompt += `- Pranzo: ${ristorante.orari.pranzo}\\n`;
            prompt += `- Cena: ${ristorante.orari.cena}\\n`;
            prompt += `- Giorni di apertura: ${ristorante.orari.giorni_apertura}\\n`;
        }
        
        // Prenotazioni
        if (ristorante.prenotazioni) {
            prompt += `\\nPRENOTAZIONI:\\n`;
            prompt += `- Telefono: ${ristorante.prenotazioni.telefono}\\n`;
            prompt += `- Email: ${ristorante.prenotazioni.email}\\n`;
        }
        
        // Menu
        if (ristorante.menu) {
            prompt += `\\nMENU (con prezzi in euro):\\n`;
            
            if (ristorante.menu.antipasti && ristorante.menu.antipasti.length > 0) {
                prompt += `\\nANTIPASTI:\\n`;
                ristorante.menu.antipasti.forEach(item => {
                    prompt += `- ${item.nome} (€${item.prezzo})\\n`;
                });
            }
            
            if (ristorante.menu.primi && ristorante.menu.primi.length > 0) {
                prompt += `\\nPRIMI:\\n`;
                ristorante.menu.primi.forEach(item => {
                    prompt += `- ${item.nome} (€${item.prezzo})\\n`;
                });
            }
            
            if (ristorante.menu.secondi && ristorante.menu.secondi.length > 0) {
                prompt += `\\nSECONDI:\\n`;
                ristorante.menu.secondi.forEach(item => {
                    prompt += `- ${item.nome} (€${item.prezzo})\\n`;
                });
            }
            
            if (ristorante.menu.dolci && ristorante.menu.dolci.length > 0) {
                prompt += `\\nDOLCI:\\n`;
                ristorante.menu.dolci.forEach(item => {
                    prompt += `- ${item.nome} (€${item.prezzo})\\n`;
                });
            }
        }
        
        return prompt;
    }

    /**
     * Genera un prompt con informazioni sulle attività
     * @returns {string} Prompt sulle attività
     */
    generateActivitiesPrompt() {
        const attivita = this.cache.attivita;
        if (!attivita || Object.keys(attivita).length === 0) {
            return "Mi dispiace, non ho informazioni sulle attività al momento.";
        }
        
        let prompt = "\\n\\nEcco le informazioni sulle attività disponibili:\\n";
        
        // Attività nella struttura
        if (attivita.nella_struttura && attivita.nella_struttura.length > 0) {
            prompt += `\\nATTIVITÀ NELLA STRUTTURA:\\n`;
            attivita.nella_struttura.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Orari: ${item.orari}, Durata: ${item.durata}, Prezzo: €${item.prezzo}\\n`;
                prompt += `  Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        // Attività nei dintorni
        if (attivita.nei_dintorni && attivita.nei_dintorni.length > 0) {
            prompt += `\\nATTIVITÀ NEI DINTORNI:\\n`;
            attivita.nei_dintorni.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Distanza: ${item.distanza}, Durata: ${item.durata}, Prezzo: €${item.prezzo}\\n`;
                prompt += `  Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        return prompt;
    }

    /**
     * Genera un prompt con informazioni sugli eventi
     * @returns {string} Prompt sugli eventi
     */
    generateEventsPrompt() {
        const eventi = this.cache.eventi;
        if (!eventi || Object.keys(eventi).length === 0) {
            return "Mi dispiace, non ho informazioni sugli eventi al momento.";
        }
        
        let prompt = "\\n\\nEcco le informazioni sugli eventi:\\n";
        
        // Eventi regolari
        if (eventi.eventi && eventi.eventi.length > 0) {
            prompt += `\\nEVENTI REGOLARI:\\n`;
            eventi.eventi.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Data: ${item.data}, Orario: ${item.orario}, Luogo: ${item.luogo}\\n`;
                prompt += `  Prezzo: €${item.prezzo}, Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        // Eventi speciali
        if (eventi.eventi_speciali && eventi.eventi_speciali.length > 0) {
            prompt += `\\nEVENTI SPECIALI:\\n`;
            eventi.eventi_speciali.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Data: ${item.data}, ${item.orario ? 'Orario: ' + item.orario + ', ' : ''}`;
                prompt += `Durata: ${item.durata}, Luogo: ${item.luogo}\\n`;
                prompt += `  Prezzo: €${item.prezzo}, Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        return prompt;
    }

    /**
     * Genera un prompt con informazioni sui servizi
     * @returns {string} Prompt sui servizi
     */
    generateServicesPrompt() {
        const servizi = this.cache.servizi;
        if (!servizi || Object.keys(servizi).length === 0) {
            return "Mi dispiace, non ho informazioni sui servizi al momento.";
        }
        
        let prompt = "\\n\\nEcco le informazioni sui servizi offerti:\\n";
        
        // Servizi hotel
        if (servizi.servizi_hotel && servizi.servizi_hotel.length > 0) {
            prompt += `\\nSERVIZI HOTEL:\\n`;
            servizi.servizi_hotel.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Orari: ${item.orari}\\n`;
            });
        }
        
        // Servizi benessere
        if (servizi.servizi_benessere && servizi.servizi_benessere.length > 0) {
            prompt += `\\nSERVIZI BENESSERE:\\n`;
            servizi.servizi_benessere.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                prompt += `  Orari: ${item.orari}, Prezzo: ${item.prezzo}\\n`;
                prompt += `  Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        // Servizi extra
        if (servizi.servizi_extra && servizi.servizi_extra.length > 0) {
            prompt += `\\nSERVIZI EXTRA:\\n`;
            servizi.servizi_extra.forEach(item => {
                prompt += `- ${item.nome}: ${item.descrizione}\\n`;
                if (item.orari) prompt += `  Orari: ${item.orari}\\n`;
                prompt += `  Prezzo: ${item.prezzo}, Prenotazione: ${item.prenotazione}\\n`;
            });
        }
        
        return prompt;
    }

    /**
     * Genera un prompt con informazioni generali
     * @returns {string} Prompt generale
     */
    generateGeneralPrompt() {
        let prompt = "\\n\\nEcco alcune informazioni generali su Villa Petriolo:\\n";
        
        // Ristorante
        const ristorante = this.cache.ristorante;
        if (ristorante && ristorante.orari) {
            prompt += `\\nRISTORANTE:\\n`;
            prompt += `- Orari pranzo: ${ristorante.orari.pranzo}\\n`;
            prompt += `- Orari cena: ${ristorante.orari.cena}\\n`;
        }
        
        // Servizi principali
        const servizi = this.cache.servizi;
        if (servizi && servizi.servizi_hotel) {
            prompt += `\\nSERVIZI PRINCIPALI:\\n`;
            servizi.servizi_hotel.slice(0, 3).forEach(item => {
                prompt += `- ${item.nome}: ${item.orari}\\n`;
            });
        }
        
        // Attività principali
        const attivita = this.cache.attivita;
        if (attivita && attivita.nella_struttura) {
            prompt += `\\nATTIVITÀ PRINCIPALI:\\n`;
            attivita.nella_struttura.slice(0, 2).forEach(item => {
                prompt += `- ${item.nome}: ${item.orari}\\n`;
            });
        }
        
        return prompt;
    }

    /**
     * Genera un prompt per una risposta su un argomento specifico
     * @param {string} topic - Argomento
     * @param {string} question - Domanda dell'utente
     * @returns {string} Prompt
     */
    generateResponsePrompt(topic, question) {
        let prompt = `L'utente ha chiesto: "${question}"\\n\\n`;
        
        if (topic) {
            prompt += `L'argomento della domanda è: ${topic}\\n`;
            
            switch (topic) {
                case 'menu':
                case 'ristorante':
                    prompt += this.generateRestaurantPrompt();
                    break;
                case 'attivita':
                    prompt += this.generateActivitiesPrompt();
                    break;
                case 'eventi':
                    prompt += this.generateEventsPrompt();
                    break;
                case 'servizi':
                    prompt += this.generateServicesPrompt();
                    break;
            }
        }
        
        prompt += "\\n\\nRispondi in modo cordiale, professionale e conciso, fornendo le informazioni precise richieste dall'utente.";
        
        return prompt;
    }
}

// Export singleton
module.exports = new KnowledgeBaseService();