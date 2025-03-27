// frontend/js/utils/storage.js
// Gestione del localStorage per l'applicazione

const StorageManager = {
  // Storage keys
  KEYS: {
      CHATS: 'villa_petriolo_chats',
      SESSION_ID: 'villa_petriolo_session_id',
      SIDEBAR_STATE: 'villa_petriolo_sidebar_state'
  },

  /**
   * Inizializza lo StorageManager
   */
  init: function() {
      console.log('StorageManager: Initializing');
      
      // Wait for appConfig to be available
      if (!window.appConfig || !window.appConfig.STORAGE_KEYS) {
          console.log('StorageManager: Waiting for appConfig...');
          setTimeout(() => this.init(), 100);
          return;
      }

      // Use storage keys from appConfig
      this.KEYS = window.appConfig.STORAGE_KEYS;

      // Initialize default chat if needed
      const chats = this.getChats();
      if (Object.keys(chats).length === 0) {
          console.log('StorageManager: Creating default chat');
          const defaultChatId = 'chat_' + Date.now();
          chats[defaultChatId] = {
              messages: [],
              timestamp: new Date().toISOString(),
              title: 'Nuova conversazione'
          };
          this.saveChats(chats);
      }

      console.log('StorageManager: Initialization complete');
  },

  /**
   * Ottiene tutte le chat dal localStorage
   * @returns {Object} Oggetto contenente tutte le chat
   */
  getChats: function() {
      try {
          const chats = localStorage.getItem(this.KEYS.CHATS);
          return chats ? JSON.parse(chats) : {};
      } catch (error) {
          console.error('StorageManager: Error getting chats:', error);
          return {};
      }
  },
  
  /**
   * Salva tutte le chat nel localStorage
   * @param {Object} chats - Oggetto contenente tutte le chat
   */
  saveChats: function(chats) {
      try {
          localStorage.setItem(this.KEYS.CHATS, JSON.stringify(chats));
      } catch (error) {
          console.error('StorageManager: Error saving chats:', error);
      }
  },
  
  /**
   * Salva lo stato della sidebar
   * @param {boolean} isHidden - Indica se la sidebar è nascosta
   */
  saveSidebarState: function(isHidden) {
      localStorage.setItem(this.KEYS.SIDEBAR_STATE, isHidden ? 'true' : 'false');
  },
  
  /**
   * Ottiene lo stato della sidebar
   * @returns {boolean} true se la sidebar era nascosta, false altrimenti
   */
  getSidebarState: function() {
      return localStorage.getItem(this.KEYS.SIDEBAR_STATE) === 'true';
  }
};

// Initialize after appConfig is loaded
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
});

// Esporta il modulo
window.StorageManager = StorageManager;