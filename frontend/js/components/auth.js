// frontend/js/components/auth.js
// Gestione del popup di autenticazione

const AuthComponent = {
    /**
     * Stato interno del componente
     */
    state: {
        isAuthenticated: false,
        currentView: 'login', // 'login' o 'register'
        isLoading: false,
        errors: {},
        formData: {
            login: {
                email: '',
                password: ''
            },
            register: {
                name: '',
                email: '',
                password: '',
                confirmPassword: ''
            }
        },
        message: null
    },

    /**
     * Inizializza il componente
     */
    init: function() {
        console.log('Initializing Auth Component');
        
        // Controlla se l'utente è già autenticato
        this.checkAuthentication();
        
        // Crea e inietta il markup del popup
        this.createAuthPopup();
        
        // Configura gli event listener
        this.setupEventListeners();
    },

    /**
     * Controlla se l'utente è già autenticato
     */
    checkAuthentication: function() {
        const accessToken = localStorage.getItem('accessToken');
        
        if (accessToken) {
            // Verifica la validità del token
            this.verifyToken(accessToken);
        } else {
            this.state.isAuthenticated = false;
        }
    },

    /**
     * Verifica la validità del token
     */
    verifyToken: function(token) {
        fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json().then(data => {
                    // Token valido
                    this.state.isAuthenticated = true;
                    
                    // Salva i dati utente se necessario
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    // Nascondi il popup se è visibile
                    this.hideAuthPopup();
                });
            } else {
                // Token non valido
                this.state.isAuthenticated = false;
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                
                // Mostra il popup
                this.showAuthPopup();
            }
        })
        .catch(error => {
            console.error('Error verifying token:', error);
            this.state.isAuthenticated = false;
            
            // Mostra il popup
            this.showAuthPopup();
        });
    },

    /**
     * Crea e inietta il markup HTML del popup di autenticazione
     */
    createAuthPopup: function() {
        // Crea l'elemento overlay
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.className = 'auth-overlay';
        
        // Crea il contenuto del popup
        overlay.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <img src="img/logo.png" alt="Villa Petriolo" class="auth-logo">
                    <h2 class="auth-title">Benvenuto</h2>
                    <p class="auth-subtitle">Accedi per continuare</p>
                </div>
                
                <div class="auth-body">
                    <div class="auth-tabs">
                        <div class="auth-tab active" data-view="login">Accedi</div>
                        <div class="auth-tab" data-view="register">Registrati</div>
                    </div>
                    
                    <div class="auth-forms-container">
                        <!-- Login Form -->
                        <form id="login-form" class="auth-form visible">
                            <div class="auth-form-group">
                                <label for="login-email" class="auth-label">Email</label>
                                <input type="email" id="login-email" class="auth-input" required placeholder="La tua email">
                                <div class="auth-error-message" id="login-email-error"></div>
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="login-password" class="auth-label">Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="login-password" class="auth-input" required placeholder="La tua password">
                                    <button type="button" class="password-toggle" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div class="auth-error-message" id="login-password-error"></div>
                            </div>
                            
                            <div id="login-form-message"></div>
                            
                            <button type="submit" class="auth-button" id="login-submit">
                                Accedi
                            </button>
                        </form>
                        
                        <!-- Register Form -->
                        <form id="register-form" class="auth-form hidden">
                            <div class="auth-form-group">
                                <label for="register-name" class="auth-label">Nome</label>
                                <input type="text" id="register-name" class="auth-input" required placeholder="Il tuo nome">
                                <div class="auth-error-message" id="register-name-error"></div>
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-email" class="auth-label">Email</label>
                                <input type="email" id="register-email" class="auth-input" required placeholder="La tua email">
                                <div class="auth-error-message" id="register-email-error"></div>
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-password" class="auth-label">Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="register-password" class="auth-input" required placeholder="Crea una password">
                                    <button type="button" class="password-toggle" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div class="auth-error-message" id="register-password-error"></div>
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-confirm-password" class="auth-label">Conferma Password</label>
                                <div class="password-input-container">
                                    <input type="password" id="register-confirm-password" class="auth-input" required placeholder="Conferma la password">
                                    <button type="button" class="password-toggle" tabindex="-1">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                                <div class="auth-error-message" id="register-confirm-password-error"></div>
                            </div>
                            
                            <div id="register-form-message"></div>
                            
                            <button type="submit" class="auth-button" id="register-submit">
                                Registrati
                            </button>
                        </form>
                    </div>
                    
                    <div class="auth-social">
                        <div class="auth-social-title">Oppure accedi con</div>
                        <div class="auth-social-buttons">
                            <button type="button" class="auth-social-button google" id="google-auth">
                                <i class="fab fa-google"></i> Google
                            </button>
                            <button type="button" class="auth-social-button facebook" id="facebook-auth">
                                <i class="fab fa-facebook-f"></i> Facebook
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Aggiungi il popup al DOM ma nascondilo
        document.body.appendChild(overlay);
        overlay.style.display = 'none';
    },

    /**
     * Configura tutti gli event listener
     */
    setupEventListeners: function() {
        // Tab switching
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.getAttribute('data-view');
                this.switchView(view);
            });
        });
        
        // Login form submission - with improved error handling
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.handleLogin();
                } catch (error) {
                    console.error('Error in login form submission:', error);
                    this.setMessage('login', 'Si è verificato un errore. Riprova più tardi.', 'error');
                }
                return false;
            });
        }
        
        // Register form submission - with improved error handling
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.handleRegister();
                } catch (error) {
                    console.error('Error in register form submission:', error);
                    this.setMessage('register', 'Si è verificato un errore. Riprova più tardi.', 'error');
                }
                return false;
            });
        }
        
        // Social auth buttons
        const googleAuthBtn = document.getElementById('google-auth');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => {
                window.location.href = '/api/auth/google';
            });
        }
        
        const facebookAuthBtn = document.getElementById('facebook-auth');
        if (facebookAuthBtn) {
            facebookAuthBtn.addEventListener('click', () => {
                window.location.href = '/api/auth/facebook';
            });
        }
        
        // Password visibility toggles
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const passwordInput = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
        
        // Input change handlers
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        const registerName = document.getElementById('register-name');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        
        if (loginEmail) {
            loginEmail.addEventListener('input', (e) => {
                this.state.formData.login.email = e.target.value;
                this.clearError('login', 'email');
            });
        }
        
        if (loginPassword) {
            loginPassword.addEventListener('input', (e) => {
                this.state.formData.login.password = e.target.value;
                this.clearError('login', 'password');
            });
        }
        
        if (registerName) {
            registerName.addEventListener('input', (e) => {
                this.state.formData.register.name = e.target.value;
                this.clearError('register', 'name');
            });
        }
        
        if (registerEmail) {
            registerEmail.addEventListener('input', (e) => {
                this.state.formData.register.email = e.target.value;
                this.clearError('register', 'email');
            });
        }
        
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => {
                this.state.formData.register.password = e.target.value;
                this.clearError('register', 'password');
                
                // Verifica anche la conferma password
                if (registerConfirmPassword.value) {
                    this.validateConfirmPassword();
                }
            });
        }
        
        if (registerConfirmPassword) {
            registerConfirmPassword.addEventListener('input', (e) => {
                this.state.formData.register.confirmPassword = e.target.value;
                this.validateConfirmPassword();
            });
        }
    },

    /**
     * Gestisce l'invio del form di login
     */
    handleLogin: function() {
        const { email, password } = this.state.formData.login;
        
        // Validazione
        let isValid = true;
        
        if (!email) {
            this.setError('login', 'email', 'L\'email è obbligatoria');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.setError('login', 'email', 'Email non valida');
            isValid = false;
        }
        
        if (!password) {
            this.setError('login', 'password', 'La password è obbligatoria');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Tutto ok, invia la richiesta
        this.setLoading(true, 'login');
        this.clearMessage('login');
        
        // Using promises instead of async/await to avoid syntax errors
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.message || 'Errore durante il login');
                }
                return data;
            });
        })
        .then(data => {
            // Login riuscito
            this.setMessage('login', 'Login effettuato con successo!', 'success');
            
            // Salva il token e i dati utente
            localStorage.setItem('accessToken', data.accessToken);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            // Aggiorna lo stato
            this.state.isAuthenticated = true;
            
            // Nascondi il popup dopo un breve ritardo
            setTimeout(() => {
                this.hideAuthPopup();
            }, 1000);
        })
        .catch(error => {
            console.error('Login error:', error);
            this.setMessage('login', error.message || 'Errore durante il login', 'error');
            this.shakeForm('login');
        })
        .finally(() => {
            this.setLoading(false, 'login');
        });
    },

    /**
     * Gestisce l'invio del form di registrazione
     */
    handleRegister: function() {
        const { name, email, password, confirmPassword } = this.state.formData.register;
        
        // Validazione
        let isValid = true;
        
        if (!name) {
            this.setError('register', 'name', 'Il nome è obbligatorio');
            isValid = false;
        }
        
        if (!email) {
            this.setError('register', 'email', 'L\'email è obbligatoria');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.setError('register', 'email', 'Email non valida');
            isValid = false;
        }
        
        if (!password) {
            this.setError('register', 'password', 'La password è obbligatoria');
            isValid = false;
        } else if (password.length < 8) {
            this.setError('register', 'password', 'La password deve essere di almeno 8 caratteri');
            isValid = false;
        }
        
        if (!confirmPassword) {
            this.setError('register', 'confirm-password', 'Conferma la password');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.setError('register', 'confirm-password', 'Le password non corrispondono');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Tutto ok, invia la richiesta
        this.setLoading(true, 'register');
        this.clearMessage('register');
        
        // Using promises instead of async/await to avoid syntax errors
        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.message || 'Errore durante la registrazione');
                }
                return data;
            });
        })
        .then(data => {
            // Registrazione riuscita
            this.setMessage('register', 'Registrazione completata con successo!', 'success');
            
            // Salva il token e i dati utente
            localStorage.setItem('accessToken', data.accessToken);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            
            // Aggiorna lo stato
            this.state.isAuthenticated = true;
            
            // Nascondi il popup dopo un breve ritardo
            setTimeout(() => {
                this.hideAuthPopup();
            }, 1000);
        })
        .catch(error => {
            console.error('Registration error:', error);
            this.setMessage('register', error.message || 'Errore durante la registrazione', 'error');
            this.shakeForm('register');
        })
        .finally(() => {
            this.setLoading(false, 'register');
        });
    },

    /**
     * Passa da una vista all'altra (login/register)
     */
    switchView: function(view) {
        // Aggiorna lo stato
        this.state.currentView = view;
        
        // Aggiorna i tab
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-view') === view) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Aggiorna i form
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (view === 'login') {
            loginForm.classList.remove('hidden');
            loginForm.classList.add('visible');
            registerForm.classList.remove('visible');
            registerForm.classList.add('hidden');
        } else {
            registerForm.classList.remove('hidden');
            registerForm.classList.add('visible');
            loginForm.classList.remove('visible');
            loginForm.classList.add('hidden');
        }
        
        // Pulisci messaggi ed errori
        this.clearMessage('login');
        this.clearMessage('register');
        this.clearAllErrors();
    },

    /**
     * Mostra il popup di autenticazione
     */
    showAuthPopup: function() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    },

    /**
     * Nasconde il popup di autenticazione
     */
    hideAuthPopup: function() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * Imposta lo stato di caricamento
     */
    setLoading: function(isLoading, formType) {
        this.state.isLoading = isLoading;
        
        const submitBtn = document.getElementById(`${formType}-submit`);
        if (!submitBtn) return;
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="auth-spinner"></span> Attendere...';
            submitBtn.classList.add('loading-button');
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = formType === 'login' ? 'Accedi' : 'Registrati';
            submitBtn.classList.remove('loading-button');
        }
    },

    /**
     * Imposta un messaggio nel form
     */
    setMessage: function(formType, message, type = 'error') {
        const messageEl = document.getElementById(`${formType}-form-message`);
        if (!messageEl) return;
        
        messageEl.innerHTML = `<div class="auth-form-message ${type}">${message}</div>`;
    },

    /**
     * Pulisce il messaggio dal form
     */
    clearMessage: function(formType) {
        const messageEl = document.getElementById(`${formType}-form-message`);
        if (!messageEl) return;
        
        messageEl.innerHTML = '';
    },

    /**
     * Imposta un errore in un campo del form
     */
    setError: function(formType, field, message) {
        // Aggiorna lo stato
        if (!this.state.errors[formType]) {
            this.state.errors[formType] = {};
        }
        this.state.errors[formType][field] = message;
        
        // Aggiorna l'UI
        const errorEl = document.getElementById(`${formType}-${field}-error`);
        const inputEl = document.getElementById(`${formType}-${field}`);
        
        if (errorEl) {
            errorEl.textContent = message;
        }
        
        if (inputEl) {
            inputEl.classList.add('error');
        }
    },

    /**
     * Pulisce l'errore da un campo del form
     */
    clearError: function(formType, field) {
        // Aggiorna lo stato
        if (this.state.errors[formType] && this.state.errors[formType][field]) {
            delete this.state.errors[formType][field];
        }
        
        // Aggiorna l'UI
        const errorEl = document.getElementById(`${formType}-${field}-error`);
        const inputEl = document.getElementById(`${formType}-${field}`);
        
        if (errorEl) {
            errorEl.textContent = '';
        }
        
        if (inputEl) {
            inputEl.classList.remove('error');
        }
    },

    /**
     * Pulisce tutti gli errori
     */
    clearAllErrors: function() {
        this.state.errors = {};
        
        // Pulisci gli errori dell'UI
        const errorElements = document.querySelectorAll('.auth-error-message');
        const inputElements = document.querySelectorAll('.auth-input');
        
        errorElements.forEach(el => {
            el.textContent = '';
        });
        
        inputElements.forEach(el => {
            el.classList.remove('error');
        });
    },

    /**
     * Valida il campo conferma password
     */
    validateConfirmPassword: function() {
        const { password, confirmPassword } = this.state.formData.register;
        
        if (!confirmPassword) {
            this.setError('register', 'confirm-password', 'Conferma la password');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.setError('register', 'confirm-password', 'Le password non corrispondono');
            return false;
        }
        
        this.clearError('register', 'confirm-password');
        return true;
    },

    /**
     * Valida un indirizzo email
     */
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Effetto shake sul form in caso di errore
     */
    shakeForm: function(formType) {
        const form = document.getElementById(`${formType}-form`);
        if (!form) return;
        
        form.classList.add('shake');
        
        // Rimuovi la classe dopo l'animazione
        setTimeout(() => {
            form.classList.remove('shake');
        }, 600);
    }
};

// Esporta il modulo
window.AuthComponent = AuthComponent;