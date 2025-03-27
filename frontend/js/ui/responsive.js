// frontend/js/ui/responsive.js
// Gestione responsive dell'interfaccia utente

const ResponsiveManager = {
    /**
     * Inizializza il gestore responsive
     */
    init: function() {
      this.setupMobileMenuListeners();
      this.setupResponsiveEvents();
    },
    
    /**
     * Imposta i listener per il menu mobile
     */
    setupMobileMenuListeners: function() {
      const sidebarToggle = document.getElementById('sidebar-toggle');
      const sidebarOverlay = document.getElementById('sidebar-overlay');
      const chatSidebar = document.querySelector('.chat-sidebar');
      
      // Gestione del pulsante toggle
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function(e) {
          e.stopPropagation();
          // Toggle della sidebar
          if (document.body.classList.contains('sidebar-open')) {
            window.SidebarComponent.closeSidebar();
          } else {
            window.SidebarComponent.openSidebar();
          }
        });
      }
      
      // Utilizziamo l'overlay per la chiusura della sidebar
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
          window.SidebarComponent.closeSidebar();
        });
      }
      
      // Impedisci che i clic sulla sidebar la chiudano
      if (chatSidebar) {
        chatSidebar.addEventListener('click', function(e) {
          e.stopPropagation(); // Ferma la propagazione dell'evento
        });
      }
    },
    
    /**
     * Imposta gli eventi responsive
     */
    setupResponsiveEvents: function() {
      // Gestisci i ridimensionamenti della finestra
      window.addEventListener('resize', function() {
        // Se la finestra viene ridimensionata oltre 768px mentre il menu è aperto
        if (window.innerWidth > 768 && document.body.classList.contains('sidebar-open')) {
          // Rimuovi la classe sidebar-open
          document.body.classList.remove('sidebar-open');
        }
      });
      
      // Gestisci rotazioni del dispositivo
      window.addEventListener('orientationchange', function() {
        // Se il menu è aperto, chiudilo
        if (document.body.classList.contains('sidebar-open')) {
          window.SidebarComponent.closeSidebar();
        }
        
        // Aggiorna la UI in base alla nuova orientazione
        setTimeout(function() {
          const messagesContainer = document.getElementById('messages-container');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 300);
      });
    }
  };
  
  // Esporta il modulo
  window.ResponsiveManager = ResponsiveManager;