// frontend/js/utils/api/paths.js
// Centralizza tutti i percorsi delle API per evitare inconsistenze

const ApiPaths = {
  // Definisci tutte le URL API qui
  INIT_SESSION: '/api/chat/init',
  SEND_MESSAGE: '/api/chat/message',
  CLEAR_HISTORY: '/api/chat/clear-history',
  GET_HISTORY: '/api/chat/history/{sessionId}',
  PING: '/ping',
  
  // Utility per ottenere URL completi
  getFullUrl: function(path, params = {}) {
    let url = path;
    
    // Sostituisci i parametri nel formato {param}
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
    
    return `${window.appConfig.BACKEND_URL}${url}`;
  }
};

// Esporta per l'uso in altri moduli
window.ApiPaths = ApiPaths;