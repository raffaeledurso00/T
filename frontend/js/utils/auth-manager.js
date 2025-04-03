// frontend/js/utils/auth-manager.js
// Gestione dell'autenticazione e integrazione con il preloader

const AuthManager = {
    /**
     * Stato interno del manager
     */
    state: {
        isInitialized: false,
        isAuthenticated: false,
        user: null,
        rememberMe: false
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
            
            // Nascondi la sidebar delle chat e mostra solo il componente di autenticazione
            this.updateUIForUnauthenticated();
            
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
            
            // Inizializza le chat solo per utenti autenticati
            if (typeof window.ChatCore?.init === 'function') {
                window.ChatCore.init();
            }
        }
    },
    
    /**
     * Controlla lo stato dell'autenticazione
     */
    checkAuthState: function() {
        const accessToken = localStorage.getItem('accessToken');
        const userJson = localStorage.getItem('user');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        this.state.rememberMe = rememberMe;
        
        if (accessToken) {
            // Imposta isAuthenticated a true, ma verifica comunque il token
            this.state.isAuthenticated = true;
            
            // Prova a caricare i dati dell'utente
            if (userJson) {
                try {
                    this.state.user = JSON.parse(userJson);
                    // Aggiorna immediatamente l'UI
                    this.updateUI();
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
                        
                        // Aggiorna l'UI per l'utente non autenticato
                        this.updateUIForUnauthenticated();
                        
                        // Se l'app è già caricata, mostra il popup
                        if (document.body.classList.contains('app-loaded') || document.querySelector('.page-wrapper__content.loaded')) {
                            if (window.AuthComponent) {
                                window.AuthComponent.init();
                                window.AuthComponent.showAuthPopup();
                            }
                        }
                    } else {
                        // Token valido, aggiorna l'UI
                        this.updateUI();
                    }
                })
                .catch(error => {
                    console.error('Error verifying token:', error);
                });
        } else {
            this.state.isAuthenticated = false;
            this.state.user = null;
            
            // Aggiorna l'UI per l'utente non autenticato
            this.updateUIForUnauthenticated();
        }
    },
    
    /**
     * Verifica la validità del token
     */
    verifyToken: function(token) {
        return new Promise((resolve) => {
            fetch('/api/auth/verify-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    return resolve(false);
                }
                
                return response.json().then(data => {
                    // Aggiorna i dati utente
                    if (data.user) {
                        this.state.user = data.user;
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    resolve(true);
                });
            })
            .catch(error => {
                console.error('Error in token verification:', error);
                resolve(false);
            });
        });
    },
    
    /**
     * Aggiorna l'UI con lo stato dell'utente
     */
    updateUI: function() {
        if (!this.state.user) return;
        
        // Aggiorna il nome utente nella sidebar
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = this.state.user.name || 'Utente';
        }
        
        // Aggiorna anche eventuali altri elementi UI relativi all'utente
        document.querySelectorAll('.user-info span:not(#user-name)').forEach(el => {
            el.textContent = this.state.user.name || 'Utente';
        });
        
        // Abilita funzionalità per utenti autenticati
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.disabled = false;
            newChatBtn.classList.remove('disabled');
        }
        
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Scrivi un messaggio...';
        }
        if (sendButton) {
            sendButton.disabled = false;
        }
        
        // Rimuovi eventuali messaggi di login
        const loginPrompt = document.querySelector('.login-prompt');
        if (loginPrompt) {
            loginPrompt.remove();
        }
        
        // Mostra il messaggio di benvenuto
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
        
        // Rimuovi la classe disabled dalla sidebar
        const sidebarChats = document.getElementById('sidebar-chats');
        if (sidebarChats) {
            sidebarChats.classList.remove('disabled');
        }
    },
    
    /**
     * Aggiorna l'UI per l'utente non autenticato
     */
    updateUIForUnauthenticated: function() {
        console.log('Updating UI for unauthenticated user');
        
        // Nascondi la sidebar delle chat
        const sidebarChats = document.getElementById('sidebar-chats');
        if (sidebarChats) {
            sidebarChats.innerHTML = '<div class="no-chats-message">Effettua il login per visualizzare le chat</div>';
            sidebarChats.classList.add('disabled');
        }
        
        // Disabilita il pulsante 'Nuova chat'
        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.disabled = true;
            newChatBtn.classList.add('disabled');
        }
        
        // Nascondi i messaggi nel container principale
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            // Salva i contenuti attuali per il messaggio di benvenuto
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.style.display = 'none';
            }
            
            // Rimuovi eventuali messaggi di login precedenti
            const oldLoginPrompt = document.querySelector('.login-prompt');
            if (oldLoginPrompt) {
                oldLoginPrompt.remove();
            }
            
            // Mostra un messaggio per l'utente non autenticato
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'login-prompt';
            loginPrompt.innerHTML = `
                <h2>Benvenuto a Villa Petriolo</h2>
                <p>Per utilizzare il Concierge Digitale, è necessario effettuare il login.</p>
                <div class="login-instructions">
                    <p>Clicca sull'icona utente per accedere al tuo account.</p>
                </div>
            `;
            messagesContainer.appendChild(loginPrompt);
        }
        
        // Disabilita l'input di chat
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Effettua il login per inviare messaggi...';
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
    },
    
    /**
     * Gestisce il login dell'utente
     * @param {Object} userData - Dati dell'utente
     * @param {string} token - Token di accesso
     * @param {boolean} rememberMe - Flag per ricordare l'utente
     */
    handleLogin: function(userData, token, rememberMe) {
        console.log('Handling login with remember me:', rememberMe);
        
        // Salva i dati dell'utente
        this.state.user = userData;
        this.state.isAuthenticated = true;
        this.state.rememberMe = rememberMe;
        
        // Salva i dati nel localStorage
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('rememberMe', rememberMe.toString());
        
        // Aggiorna l'UI
        this.updateUI();
        
        // Inizializza il ChatCore se disponibile
        if (typeof window.ChatCore?.init === 'function') {
            window.ChatCore.init();
        }
        
        // Chiudi il popup di autenticazione se aperto
        if (window.AuthComponent && typeof window.AuthComponent.hideAuthPopup === 'function') {
            window.AuthComponent.hideAuthPopup();
        }
    },
    
    /**
     * Gestisce il logout
     */
    logout: function() {
        try {
            // Chiamiamo prima l'updateUIForUnauthenticated per evitare flash di contenuto
            this.updateUIForUnauthenticated();
            
            // Chiama l'endpoint di logout
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
            })
            .finally(() => {
                // Indipendentemente dalla risposta, pulisci i dati locali
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                // Mantieni rememberMe se impostato
                
                // Aggiorna lo stato
                this.state.isAuthenticated = false;
                this.state.user = null;
                
                // Mostra il popup di login
                if (window.AuthComponent) {
                    window.AuthComponent.init();
                    window.AuthComponent.showAuthPopup();
                } else {
                    // Ricarica la pagina come fallback
                    window.location.reload();
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
            
            // Pulisci comunque i dati locali
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            
            // Aggiorna lo stato
            this.state.isAuthenticated = false;
            this.state.user = null;
            
            // Aggiorna l'UI per utente non autenticato
            this.updateUIForUnauthenticated();
            
            // Mostra il popup di login
            if (window.AuthComponent) {
                window.AuthComponent.init();
                window.AuthComponent.showAuthPopup();
            } else {
                // Ricarica la pagina come fallback
                window.location.reload();
            }
        }
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