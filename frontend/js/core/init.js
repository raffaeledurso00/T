// frontend/js/core/init.js
// Inizializzazione principale dell'applicazione

const AppInitializer = {
    /**
     * Inizializza l'intera applicazione
     */
    init: function() {
      console.log('Initializing Villa Petriolo Concierge application');
      
      // Verifica che tutti i moduli necessari siano caricati
      this.checkRequiredModules();
      
      // Inizializza i componenti solo se il preloader è stato completato
      if (this.isPreloaderCompleted()) {
        this.initializeComponents();
      } else {
        // Altrimenti attendi l'evento appReady
        console.log('Waiting for preloader completion');
      }
    },
    
    /**
     * Verifica che tutti i moduli richiesti siano stati caricati
     */
    checkRequiredModules: function() {
      const requiredModules = [
        'appConfig',
        'ChatAPI',
        'ChatCore',
        'EventsManager',
        'MessageComponent',
        'ModalComponent',
        'PreloaderManager',
        'ResponsiveManager',
        'SidebarComponent',
        'SidebarToggleManager',
        'StorageManager',
        'SuggestionsComponent',
        'ThemeManager'
      ];
      
      const missingModules = requiredModules.filter(module => !window[module]);
      
      if (missingModules.length > 0) {
        console.warn('Alcuni moduli richiesti non sono stati caricati:', missingModules);
      } else {
        console.log('Tutti i moduli richiesti sono stati caricati correttamente');
      }
    },
    
    /**
     * Verifica se il preloader è stato completato
     * @returns {boolean} true se il preloader è completato o assente
     */
    isPreloaderCompleted: function() {
      const preloader = document.getElementById('js-preloader');
      return !preloader || 
             preloader.style.display === 'none' || 
             getComputedStyle(preloader).opacity === '0';
    },
    
    /**
     * Inizializza tutti i componenti dell'applicazione
     */
    initializeComponents: function() {
      console.log('Initializing all components');
      
      // Inizializza la chat principale
      if (typeof window.ChatCore.initialize === 'function') {
        window.ChatCore.initialize();
      }
      
      // Inizializza il gestore dei temi
      if (typeof window.ThemeManager.init === 'function') {
        window.ThemeManager.init();
      }
      
      // Inizializza il gestore responsive
      if (typeof window.ResponsiveManager.init === 'function') {
        window.ResponsiveManager.init();
      }
    }
  };
  
  // Esporta il modulo
  window.AppInitializer = AppInitializer;
  
  // Inizializzazione quando il DOM è pronto
  document.addEventListener('DOMContentLoaded', function() {
    // Avvia l'inizializzazione dell'app
    window.AppInitializer.init();
  });