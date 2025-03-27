// backend/src/config/modelConfig.js
const MODEL_CONFIG = {
    name: 'llama3.1:8b',
    baseUrl: 'http://localhost:11434',
    apiPath: '/api/generate',
    parameters: {
        num_thread: 4,
        num_ctx: 4096,        // Aumentato per gestire conversazioni più lunghe
        temperature: 0.7,     // Più alto per maggiore creatività
        top_p: 0.9,           // Leggermente aumentato
        max_tokens: 1500,     // Più token per risposte più complete
        top_k: 40,
        repeat_penalty: 1.2,
        presence_penalty: 0.4,
        frequency_penalty: 0.5,
        stop: ["Utente:", "Ospite:"] // Aggiunto per evitare che il modello continui la conversazione
    }
};

// Esporta la configurazione
module.exports = MODEL_CONFIG;