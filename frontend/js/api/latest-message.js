// frontend/js/api/latest-message.js
// Estensione di ChatAPI per recuperare l'ultimo messaggio

(function() {
  // Aggiungi il metodo getLatestMessage a ChatAPI
  if (window.ChatAPI) {
    /**
     * Recupera l'ultimo messaggio dell'assistente per una sessione
     * @param {string} sessionId - ID della sessione
     * @returns {Promise<string>} - Ultimo messaggio dell'assistente
     */
    window.ChatAPI.getLatestMessage = async function(sessionId) {
      try {
        if (!sessionId) {
          sessionId = localStorage.getItem(window.appConfig.STORAGE_KEYS.SESSION_ID);
        }
        
        if (!sessionId) {
          return null;
        }
        
        // Determina l'URL API
        const apiUrl = window.ApiPaths ? 
          window.ApiPaths.getFullUrl('/api/chat/messages/latest/' + sessionId) : 
          `${window.appConfig.BACKEND_URL}/api/chat/messages/latest/${sessionId}`;
        
        console.log('Recupero ultimo messaggio da:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId 
          },
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.message) {
          return data.message.content || '';
        }
        
        return null;
      } catch (error) {
        console.error('Error getting latest message:', error);
        return null;
      }
    };
  }
})();