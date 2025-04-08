// src/services/knowledgeBase/KnowledgeBaseService.js
const fs = require('fs');
const path = require('path');

/**
 * Servizio per gestire la knowledge base dell'applicazione.
 * Carica e fornisce accesso ai dati strutturati dal filesystem.
 */
class KnowledgeBaseService {
    constructor() {
        this.dataCache = {};
        this.dataDir = path.join(__dirname, '../../data');
        this.initialized = false;
        
        // Log per debug
        console.log(`[KnowledgeBaseService] Inizializzazione, directory dati: ${this.dataDir}`);
        
        // Carica i dati all'avvio
        this.initialize();
    }
    
    /**
     * Inizializza il servizio caricando tutti i dati disponibili.
     */
    async initialize() {
        try {
            // Carica dati JSON
            await this.loadJSONFiles();
            
            // Carica dati JavaScript
            await this.loadJSModules();
            
            this.initialized = true;
            console.log('[KnowledgeBaseService] Inizializzazione completata');
            
            // Log di debug per vedere quali dati sono stati caricati
            console.log('[KnowledgeBaseService] Dati disponibili:', Object.keys(this.dataCache));
        } catch (error) {
            console.error('[KnowledgeBaseService] Errore di inizializzazione:', error);
        }
    }
    
    /**
     * Carica tutti i file JSON dalla directory dati.
     */
    async loadJSONFiles() {
        try {
            // Ottieni tutti i file JSON
            const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.json'));
            console.log(`[KnowledgeBaseService] Trovati ${files.length} file JSON: ${files.join(', ')}`);
            
            // Carica ogni file
            for (const file of files) {
                try {
                    const filePath = path.join(this.dataDir, file);
                    const data = fs.readFileSync(filePath, 'utf8');
                    const parsedData = JSON.parse(data);
                    const key = file.replace('.json', '');
                    
                    this.dataCache[key] = parsedData;
                    console.log(`[KnowledgeBaseService] Caricato ${file} con chiave '${key}'`);
                } catch (error) {
                    console.error(`[KnowledgeBaseService] Errore caricando ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('[KnowledgeBaseService] Errore caricando i file JSON:', error);
            throw error;
        }
    }
    
    /**
     * Carica tutti i moduli JavaScript dalla directory dati.
     */
    async loadJSModules() {
        try {
            // Ottieni tutti i file JS
            const files = fs.readdirSync(this.dataDir).filter(file => file.endsWith('.js'));
            console.log(`[KnowledgeBaseService] Trovati ${files.length} file JS: ${files.join(', ')}`);
            
            // Carica ogni modulo
            for (const file of files) {
                try {
                    const modulePath = path.join(this.dataDir, file);
                    // Pulisce la cache del require per assicurarsi di caricare la versione più recente
                    delete require.cache[require.resolve(modulePath)];
                    
                    const moduleData = require(modulePath);
                    const key = file.replace('.js', '');
                    
                    this.dataCache[key] = moduleData;
                    console.log(`[KnowledgeBaseService] Caricato modulo ${file} con chiave '${key}'`);
                } catch (error) {
                    console.error(`[KnowledgeBaseService] Errore caricando il modulo ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('[KnowledgeBaseService] Errore caricando i moduli JS:', error);
            throw error;
        }
    }
    
    /**
     * Restituisce i dati del ristorante con priorità al file JSON.
     * @returns {Object} Dati del ristorante
     */
    getRestaurantData() {
        const jsonData = this.dataCache['ristorante'] || null;
        const jsData = this.dataCache['restaurant'] || null;
        
        // Se entrambi sono disponibili, unisce i dati dando priorità al JSON
        if (jsonData && jsData) {
            console.log('[KnowledgeBaseService] Dati ristorante trovati in entrambi i formati, integrazione in corso');
            
            // Creiamo un nuovo oggetto per evitare modifiche agli originali
            const result = { 
                ...jsData,
                orari: jsonData.orari || {
                    pranzo: jsData.openingHours?.lunch?.start + ' - ' + jsData.openingHours?.lunch?.end,
                    cena: jsData.openingHours?.dinner?.start + ' - ' + jsData.openingHours?.dinner?.end,
                    giorni_apertura: "tutti i giorni"
                },
                prenotazioni: jsonData.prenotazioni
            };
            
            return result;
        }
        
        // Altrimenti restituisce i dati disponibili o null
        return jsonData || jsData || null;
    }
    
    /**
     * Restituisce i dati delle attività.
     * @returns {Object} Dati delle attività
     */
    getActivitiesData() {
        return this.dataCache['attivita'] || null;
    }
    
    /**
     * Restituisce i dati degli eventi.
     * @returns {Object} Dati degli eventi
     */
    getEventsData() {
        const jsonData = this.dataCache['eventi'] || null;
        const jsData = this.dataCache['events'] || null;
        
        return jsonData || jsData || null;
    }
    
    /**
     * Restituisce i dati dei servizi.
     * @returns {Object} Dati dei servizi
     */
    getServicesData() {
        const jsonData = this.dataCache['servizi'] || null;
        const jsData = this.dataCache['services'] || null;
        
        return jsonData || jsData || null;
    }
    
    /**
     * Verifica se i dati per una specifica categoria sono disponibili.
     * @param {string} category - Nome della categoria (restaurant, activities, events, services)
     * @returns {boolean} True se i dati sono disponibili
     */
    hasData(category) {
        switch (category) {
            case 'restaurant':
                return this.getRestaurantData() !== null;
            case 'activities':
                return this.getActivitiesData() !== null;
            case 'events':
                return this.getEventsData() !== null;
            case 'services':
                return this.getServicesData() !== null;
            default:
                return false;
        }
    }
    
    /**
     * Ottiene tutti i dati disponibili.
     * @returns {Object} Tutti i dati 
     */
    getAllData() {
        return {
            restaurant: this.getRestaurantData(),
            activities: this.getActivitiesData(),
            events: this.getEventsData(),
            services: this.getServicesData()
        };
    }
    
    /**
     * Aggiorna l'orario del ristorante.
     * @param {Object} newHours - Nuovi orari
     * @returns {boolean} True se l'aggiornamento è riuscito
     */
    updateRestaurantHours(newHours) {
        try {
            // Ottieni dati correnti
            const restaurantData = this.dataCache['ristorante'];
            if (!restaurantData) return false;
            
            // Aggiorna orari
            restaurantData.orari = { ...restaurantData.orari, ...newHours };
            
            // Salva su file
            fs.writeFileSync(
                path.join(this.dataDir, 'ristorante.json'),
                JSON.stringify(restaurantData, null, 2),
                'utf8'
            );
            
            return true;
        } catch (error) {
            console.error('[KnowledgeBaseService] Errore aggiornando orari ristorante:', error);
            return false;
        }
    }
}

// Crea e esporta una singola istanza del servizio
const knowledgeBaseService = new KnowledgeBaseService();
module.exports = knowledgeBaseService;