// frontend/js/api/polling.js
// Modulo per implementare il polling delle risposte quando la richiesta originale va in timeout

// Estendi ChatAPI con funzionalità di polling
(function() {
  // Memorizza lo stato delle richieste in corso
  const pendingRequests = {};
  
  // Aggiungi il metodo di polling a ChatAPI
  if (window.ChatAPI) {
    /**
     * Implementa un meccanismo di polling per recuperare risposte da richieste
     * che hanno superato il timeout originale ma che potrebbero essere ancora
     * in elaborazione sul server.
     * 
     * @param {string} sessionId - ID della sessione
     * @param {string} originalMessage - Messaggio originale inviato dall'utente
     * @param {number} attempts - Numero massimo di tentativi di polling
     * @returns {Promise<string>} - Risposta dal server o messaggio di fallback
     */
    window.ChatAPI.pollForResponse = async function(sessionId, originalMessage, attempts = 5) {
      // Registra la richiesta come in attesa
      const requestId = `${sessionId}_${Date.now()}`;
      pendingRequests[requestId] = true;
      
      // Funzione per attendere un intervallo
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      try {
        console.log(`Iniziato polling per la risposta (${attempts} tentativi rimanenti)...`);
        
        for (let i = 0; i < attempts; i++) {
          // Attendere un tempo crescente tra i tentativi (2, 4, 6, 8, 10 secondi)
          const waitTime = (i + 1) * 2000;
          await wait(waitTime);
          
          // Verificare se il polling è stato cancellato
          if (!pendingRequests[requestId]) {
            console.log('Polling cancellato');
            return "La richiesta è stata cancellata.";
          }
          
          try {
            console.log(`Tentativo di polling #${i+1}`);
            
            // Prova a ottenere l'ultima risposta dalla cronologia
            const response = await this.getLatestMessage(sessionId);
            
            if (response) {
              console.log('Risposta ottenuta tramite polling:', response.substring(0, 30) + '...');
              // Rimuovi la richiesta dall'elenco di quelle in attesa
              delete pendingRequests[requestId];
              return response;
            }
          } catch (pollingError) {
            console.warn(`Errore nel tentativo di polling #${i+1}:`, pollingError);
          }
        }
        
        // Se arriviamo qui, tutti i tentativi sono falliti
        delete pendingRequests[requestId];
        return "Abbiamo riscontrato un ritardo nella risposta. Il messaggio potrebbe essere ricevuto successivamente, oppure puoi provare a inviarlo di nuovo.";
      } catch (error) {
        console.error('Errore durante il polling:', error);
        delete pendingRequests[requestId];
        return "Si è verificato un errore durante il recupero della risposta. Per favore riprova più tardi.";
      }
    };
    
    window.ChatAPI.getLastMessage = async function(sessionId) {
      try {
        return await this.getLatestMessage(sessionId);
      } catch (error) {
        console.error('Errore nel recupero dell\'ultimo messaggio:', error);
        return null;
      }
    };
    
    /**
     * Cancella tutte le richieste di polling in corso
     */
    window.ChatAPI.cancelAllPolling = function() {
      Object.keys(pendingRequests).forEach(key => {
        pendingRequests[key] = false;
      });
    };
  }
})();