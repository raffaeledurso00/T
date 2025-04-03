// frontend/js/api/chat.js
// API for interacting with the chat backend

const ChatAPI = {
  /**
   * Initializes a new chat session with the backend
   * @returns {Promise<string>} Session ID from the backend
   */
  initializeSession: async function() {
    try {
      // Log the initialization URL
      const initUrl = window.appConfig.BACKEND_URL.endsWith('/api') 
        ? `${window.appConfig.BACKEND_URL}/chat/init` 
        : `${window.appConfig.BACKEND_URL}/api/chat/init`;
      
      console.log('Initializing session with URL:', initUrl);
      
      const response = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error('Init session error:', response.status, response.statusText);
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Session initialized with ID:', data.sessionId);
      
      // Store session ID in localStorage for persistence
      localStorage.setItem(window.appConfig.STORAGE_KEYS.SESSION_ID, data.sessionId);
      
      return data.sessionId;
    } catch (error) {
      console.error('Error initializing session:', error);
      // Return a fallback session ID
      const fallbackId = 'fallback-' + Date.now();
      localStorage.setItem(window.appConfig.STORAGE_KEYS.SESSION_ID, fallbackId);
      return fallbackId;
    }
  },
  
  /**
   * Sends a message to the backend
   * @param {string} message - User message to send
   * @param {string} sessionId - Current session ID
   * @param {Object} contextData - Additional context data
   * @returns {Promise<string>} Bot's response
   */
  sendMessage: async function(message, sessionId, contextData = {}) {
    try {
        // Verifica sessionId
        if (!sessionId) {
            sessionId = localStorage.getItem(window.appConfig.STORAGE_KEYS.SESSION_ID);
            if (!sessionId) {
                sessionId = await this.initializeSession();
            }
        }

        // Log the request details
        console.log('Backend URL config:', {
          baseUrl: window.appConfig.BACKEND_URL,
          sessionId: sessionId
        });

        // Add request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // Determine the correct API URL using the config
        const apiUrl = `${window.appConfig.BACKEND_URL}/api/chat/message`;
        
        // Prepare payload with minimal data to avoid issues
        const payload = {
          message: message
        };
        
        console.log('Sending message to backend:', {
            url: apiUrl,
            sessionId,
            messageLength: message.length
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify(payload),
            signal: controller.signal // Add timeout signal
        });

        clearTimeout(timeoutId); // Clear timeout

        if (!response.ok) {
            console.error('Server error:', response.status, response.statusText);
            try {
                const errorText = await response.text();
                console.error('Error details:', errorText);
            } catch (e) {
                console.error('Could not read error details');
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response received:', data);
        
        // Extract the message from the response
        return data.message || 
               (typeof data === 'string' ? data : "Risposta non valida dal server");

    } catch (error) {
        console.error('Error sending message:', error);
        
        // Handle different error types
        if (error.name === 'AbortError') {
            return "La richiesta è scaduta. Il server potrebbe essere sovraccarico. Per favore riprova più tardi.";
        }
        
        if (error.message && error.message.includes('Failed to fetch')) {
            return "Impossibile connettersi al server. Verifica la tua connessione Internet o contatta l'assistenza.";
        }
        
        return "Si è verificato un errore di comunicazione. Per favore riprova più tardi.";
    }
  },
  
  /**
   * Clears the chat history from the backend
   * @param {string} sessionId - Session ID to clear
   * @returns {Promise<Object>} Result of clearing history
   */
  clearHistory: async function(sessionId) {
    try {
      if (!sessionId) {
        sessionId = localStorage.getItem(window.appConfig.STORAGE_KEYS.SESSION_ID);
      }
      
      if (!sessionId) {
        return { success: false, message: 'No session to clear' };
      }
      
      // Use the config URL
      const apiUrl = `${window.appConfig.BACKEND_URL}/api/chat/clear-history`;
      
      console.log('Clearing history with URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ sessionId })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error clearing history:', error);
      return { 
        success: false, 
        message: 'Failed to clear history due to a server error' 
      };
    }
  },
  
  /**
   * Retrieves chat history from the backend
   * @param {string} sessionId - Session ID to get history for
   * @returns {Promise<Array>} Chat history messages
   */
  getHistory: async function(sessionId) {
    try {
      if (!sessionId) {
        sessionId = localStorage.getItem(window.appConfig.STORAGE_KEYS.SESSION_ID);
      }
      
      if (!sessionId) {
        return [];
      }
      
      // Use the config URL
      const apiUrl = `${window.appConfig.BACKEND_URL}/api/chat/history/${sessionId}`;
      
      console.log('Getting history with URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId 
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  },
  
  /**
   * Test connection to backend with a simple ping
   * @returns {Promise<boolean>} Whether the connection was successful
   */
  testConnection: async function() {
    try {
      const pingUrl = window.appConfig.BACKEND_URL + '/ping';
      console.log('Testing connection to:', pingUrl);
      
      // Prova prima con GET
      try {
        const response = await fetch(pingUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit' // Importante per evitare problemi CORS
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Connection test result (GET):', data);
          return true;
        }
      } catch (getError) {
        console.log('GET ping failed, trying POST...');
      }
      
      // Prova con POST come fallback
      try {
        const postResponse = await fetch(pingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit', // Importante per evitare problemi CORS
          body: JSON.stringify({})
        });
        
        if (postResponse.ok) {
          const data = await postResponse.json();
          console.log('Connection test result (POST):', data);
          return true;
        }
      } catch (postError) {
        console.log('POST ping failed, trying PHP fallback...');
      }
      
      // Prova con PHP fallback come ultima risorsa
      try {
        const phpUrl = window.location.origin + '/ping.php';
        console.log('Testing PHP fallback at:', phpUrl);
        
        const phpResponse = await fetch(phpUrl, {
          method: 'GET',
          cache: 'no-cache',
          credentials: 'omit'
        });
        
        if (phpResponse.ok) {
          const data = await phpResponse.json();
          console.log('Connection test result (PHP):', data);
          return true;
        }
      } catch (phpError) {
        console.log('All ping attempts failed');
      }
      
      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
};

// Esegui un test di connessione all'avvio
ChatAPI.testConnection()
  .then(isConnected => {
    console.log('Backend connection test:', isConnected ? 'SUCCESSFUL' : 'FAILED');
  });

// Export the ChatAPI
window.ChatAPI = ChatAPI;