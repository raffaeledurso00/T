// frontend/js/utils/auth-manager.js
// Gestione dell'autenticazione e integrazione con il preloader

const AuthManager = {
    /**
     * Stato interno del manager
     */
    state: {
        isInitialized: false,
        isAuthenticated: false,
        user: null
    },
    
    /**
     * Inizializza il manager
     */
    init: function() {
        console.log('Initializing Auth Manager');
        
        if (this.state.isInitialized) return;
        
        // Carica lo script del componente auth se non è già presente
        this.loadAuthComponent()
            .then(() => {
                // Registra l'event listener per l'evento appReady
                document.addEventListener('appReady', this.handleAppReady.bind(this));
                
                // Controlla subito lo stato dell'autenticazione
                this.checkAuthState();
                
                // Imposta flag di inizializzazione
                this.state.isInitialized = true;
                
                console.log('Auth Manager initialized');
            })
            .catch(error => {
                console.error('Error initializing Auth Manager:', error);
            });
    },
    
    /**
     * Carica lo script del componente auth se non è già presente
     */
    loadAuthComponent: function() {
        return new Promise((resolve, reject) => {
            // Verifica se il componente è già caricato
            if (window.AuthComponent) {
                resolve();
                return;
            }
            
            // Carica il CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/components/auth-popup.css';
            document.head.appendChild(link);
            
            // Carica lo script
            const script = document.createElement('script');
            script.src = 'js/components/auth.js';
            script.async = true;
            
            script.onload = () => {
                console.log('Auth Component script loaded');
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('Error loading Auth Component script:', error);
                reject(error);
            };
            
            document.body.appendChild(script);
        });
    },
    
    /**
     * Gestisce l'evento appReady (quando il preloader è completato)
     */
    handleAppReady: function() {
        console.log('App ready event received in Auth Manager');
        
        // Verifica se l'utente è autenticato
        if (!this.state.isAuthenticated) {
            // Se non autenticato, inizializza e mostra il componente di autenticazione
            console.log('User not authenticated, showing auth popup');
            
            if (window.AuthComponent) {
                // Inizializza il componente se non è già inizializzato
                window.AuthComponent.init();
                
                // Mostra il popup di autenticazione
                setTimeout(() => {
                    window.AuthComponent.showAuthPopup();
                }, 500); // Piccolo ritardo per garantire che l'animazione del preloader sia completata
            } else {
                console.error('Auth Component not available!');
            }
        } else {
            console.log('User already authenticated, proceeding to app');
            
            // Aggiorna la UI con lo stato dell'utente
            this.updateUI();
        }
    },
    
    /**
     * Controlla lo stato dell'autenticazione
     */
    checkAuthState: function() {
        const accessToken = localStorage.getItem('accessToken');
        const userJson = localStorage.getItem('user');
        
        if (accessToken) {
            // Imposta isAuthenticated a true, ma verifica comunque il token
            this.state.isAuthenticated = true;
            
            // Prova a caricare i dati dell'utente
            if (userJson) {
                try {
                    this.state.user = JSON.parse(userJson);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    // Cancella i dati corrotti
                    localStorage.removeItem('user');
                }
            }
            
            // Verifica la validità del token in background
            this.verifyToken(accessToken)
                .then(valid => {
                    if (!valid) {
                        // Token non valido, aggiorna lo stato
                        this.state.isAuthenticated = false;
                        this.state.user = null;
                        
                        // Cancella i dati locali
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('user');
                        
                        // Se l'app è già caricata, mostra il popup
                        if (document.body.classList.contains('app-loaded') || document.querySelector('.page-wrapper__content.loaded')) {
                            if (window.AuthComponent) {
                                window.AuthComponent.init();
                                window.AuthComponent.showAuthPopup();
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error verifying token:', error);
                });
        } else {
            this.state.isAuthenticated = false;
            this.state.user = null;
        }
    },
    
    /**
     * Verifica la validità del token
     */
    verifyToken: async function(token) {
        try {
            const response = await fetch('/api/auth/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Aggiorna i dati utente
                if (data.user) {
                    this.state.user = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error in token verification:', error);
            return false;
        }
    },
    
    /**
     * Aggiorna l'UI con lo stato dell'utente
     */
    updateUI: function() {
        if (!this.state.user) return;
        
        // Aggiorna il nome utente nella sidebar
        const userInfoElement = document.querySelector('.user-info span');
        if (userInfoElement) {
            userInfoElement.textContent = this.state.user.name || 'Utente';
        }
    },
    
    /**
     * Gestisce il logout
     */
    logout: async function() {
        try {
            // Chiama l'endpoint di logout
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
        
        // Indipendentemente dalla risposta, pulisci i dati locali
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Aggiorna lo stato
        this.state.isAuthenticated = false;
        this.state.user = null;
        
        // Ricarica la pagina per reinizializzare tutto
        window.location.reload();
    }
};

// Esporta il modulo
window.AuthManager = AuthManager;

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    // Inizializza l'AuthManager
    window.AuthManager.init();
});

// Esegui anche con l'evento di caricamento completo della finestra
window.addEventListener('load', function() {
    if (!window.AuthManager.state.isInitialized) {
        window.AuthManager.init();
    }
});