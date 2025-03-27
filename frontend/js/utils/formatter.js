// frontend/js/utils/formatter.js
// Questo file serve come punto di ingresso semplificato per i formatter.
// Include i singoli moduli del formatter e li espone globalmente.

// Qui includiamo tutti i moduli del formatter in modo esplicito
// Questo ci permette di avere un punto di ingresso unico mantenendo la modularità

/**
 * Carica tutti i moduli del formatter in modo sequenziale
 */
(function() {
    console.log('Loading formatter modules...');
    
    // Lista dei file da caricare nell'ordine corretto
    const formatterModules = [
        'js/utils/formatter/base-formatter.js',
        'js/utils/formatter/text-utils.js',
        'js/utils/formatter/menu-formatter.js',
        'js/utils/formatter/activity-formatter.js',
        'js/utils/formatter/event-formatter.js',
        'js/utils/formatter/generic-formatter.js',
        'js/utils/formatter/index.js'
    ];
    
    let loadedCount = 0;
    
    // Funzione per caricare un modulo
    function loadModule(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;  // Mantieni l'ordine di caricamento
            
            script.onload = () => {
                loadedCount++;
                console.log(`Loaded formatter module: ${src} (${loadedCount}/${formatterModules.length})`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`Failed to load formatter module: ${src}`);
                reject(error);
            };
            
            document.body.appendChild(script);
        });
    }
    
    // Carica i moduli in sequenza
    async function loadAllModules() {
        try {
            for (const moduleSrc of formatterModules) {
                await loadModule(moduleSrc);
            }
            console.log('All formatter modules loaded successfully');
            
            // Invia un evento per segnalare che tutti i moduli sono caricati
            const event = new CustomEvent('formattersLoaded');
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error loading formatter modules:', error);
        }
    }
    
    // Avvia il caricamento dei moduli
    loadAllModules();
})();