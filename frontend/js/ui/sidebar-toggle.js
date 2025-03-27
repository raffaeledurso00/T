// frontend/js/ui/sidebar-toggle.js
// Gestione del pulsante di toggle della sidebar

const SidebarToggleManager = {
    /**
     * Inizializza il gestore del toggle della sidebar
     */
    init: function() {
        console.log('Initializing sidebar toggle manager');
        this.setupSidebarToggle();
        this.loadSavedState();
    },
    
    /**
     * Configura il toggle della sidebar
     */
    setupSidebarToggle: function() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        if (!toggleBtn) {
            console.error('Sidebar toggle button not found');
            return;
        }
        
        // Rimuovi eventuali listener precedenti
        const newToggleBtn = toggleBtn.cloneNode(true);
        if (toggleBtn.parentNode) {
            toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        }
        
        // Aggiungi il nuovo event listener
        newToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });
        
        console.log('Sidebar toggle button event listener set up');
    },
    
    /**
     * Toggle della sidebar
     */
    toggleSidebar: function() {
        const isHidden = document.body.classList.toggle('sidebar-hidden');
        console.log('Sidebar toggled, hidden:', isHidden);
        
        // Salva lo stato
        if (window.StorageManager && typeof window.StorageManager.saveSidebarState === 'function') {
            window.StorageManager.saveSidebarState(isHidden);
        }
    },
    
    /**
     * Carica lo stato salvato della sidebar
     */
    loadSavedState: function() {
        if (window.StorageManager && typeof window.StorageManager.getSidebarState === 'function') {
            const isHidden = window.StorageManager.getSidebarState();
            if (isHidden) {
                document.body.classList.add('sidebar-hidden');
                console.log('Sidebar state restored to hidden');
            } else {
                document.body.classList.remove('sidebar-hidden');
                console.log('Sidebar state restored to visible');
            }
        }
    }
};

// Esporta il modulo
window.SidebarToggleManager = SidebarToggleManager;