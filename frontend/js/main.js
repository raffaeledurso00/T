// frontend/js/main.js
// Improved entry point for the Villa Petriolo Concierge application

/**
 * Villa Petriolo Concierge Digitale
 * 
 * This file is the main entry point for the application.
 * It handles loading all necessary modules and initializing the app.
 * 
 * The loading sequence is:
 * 1. Configuration
 * 2. Utilities
 * 3. API
 * 4. Components
 * 5. UI
 * 6. Core
 * 7. Initialization
 */

(function() {
    console.log('Villa Petriolo Concierge Digitale - Starting application initialization');
    
    // Load state tracking
    const loadedModules = {
        config: false,
        utils: false,
        api: false,
        components: false,
        ui: false,
        core: false
    };
    
    // Module groups to load in order
    const moduleGroups = [
        {
            name: 'config',
            files: ['js/config.js']
        },
        {
            name: 'utils',
            files: [
                'js/utils/storage.js',
                'js/utils/auth-manager.js',
                'js/utils/formatter/base-formatter.js',
                'js/utils/formatter/text-utils.js',
                'js/utils/formatter/menu-formatter.js',
                'js/utils/formatter/activity-formatter.js',
                'js/utils/formatter/event-formatter.js',
                'js/utils/formatter/generic-formatter.js',
                'js/utils/formatter/index.js',
                'js/utils/context.js',
                'js/utils/dom.js',
                'js/utils/api/paths.js'
            ]
        },
        {
            name: 'api',
            files: [
                'js/api/chat.js',
                'js/api/polling.js',
                'js/api/latest-message.js'
            ]
        },
        {
            name: 'components',
            files: [
                'js/components/auth.js',
                'js/components/message.js',
                'js/components/suggestions.js',
                'js/components/modal.js',
                'js/components/sidebar.js'
            ]
        },
        {
            name: 'ui',
            files: [
                'js/ui/responsive.js',
                'js/ui/sidebar-toggle.js',
                'js/ui/preloader.js'
            ]
        },
        {
            name: 'core',
            files: [
                'js/core/chat.js',
                'js/core/events.js',
                'js/core/init.js'
            ]
        }
    ];
    
    // Function to load a script and track its loading
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`Script already loaded: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Keep loading order
            
            script.onload = () => {
                console.log(`Loaded: ${src}`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`Failed to load: ${src}`, error);
                // Resolve anyway to continue loading other scripts
                resolve();
            };
            
            document.body.appendChild(script);
        });
    }
    
    // Function to load a group of modules
    function loadModuleGroup(group) {
        console.log(`Loading module group: ${group.name}`);
        
        try {
            // Load all scripts in the group
            const promises = [];
            for (const file of group.files) {
                promises.push(loadScript(file));
            }
            
            return Promise.all(promises)
                .then(() => {
                    // Mark group as loaded
                    loadedModules[group.name] = true;
                    console.log(`Module group loaded: ${group.name}`);
                    
                    // Dispatch event for module group loaded
                    const event = new CustomEvent(`${group.name}Loaded`);
                    document.dispatchEvent(event);
                    
                    return true;
                })
                .catch(error => {
                    console.error(`Error loading module group ${group.name}:`, error);
                    return false;
                });
        } catch (error) {
            console.error(`Error in loadModuleGroup ${group.name}:`, error);
            return Promise.resolve(false);
        }
    }
    
    // Load all module groups in sequence
    function loadAllModules() {
        let chain = Promise.resolve();
        
        moduleGroups.forEach(group => {
            chain = chain.then(() => loadModuleGroup(group));
        });
        
        chain.then(() => {
            // All modules loaded, initialize application
            initializeApplication();
        }).catch(error => {
            console.error('Error in module loading chain:', error);
            // Try to initialize anyway
            initializeApplication();
        });
    }
    
    // Initialize application after all modules are loaded
    function initializeApplication() {
        console.log('All modules loaded, initializing application...');
        
        // Ensure ChatCore is available first
        if (window.ChatCore) {
            console.log('ChatCore disponibile, inizializzazione in corso');
            if (typeof window.ChatCore.initialize === 'function') {
                try {
                    window.ChatCore.initialize();
                    console.log('ChatCore inizializzato correttamente');
                } catch(e) {
                    console.error('Errore inizializzazione ChatCore:', e);
                }
            } else {
                console.error('ChatCore.initialize non disponibile!');
            }
        } else {
            console.error('ChatCore non disponibile!');
        }
        
        // Create fallbacks for essential modules if not loaded
        createFallbacks();
        
        // Setup global event handlers
        setupGlobalEventHandlers();
        
        // Trigger appReady event
        const appReadyEvent = new CustomEvent('appReady');
        document.dispatchEvent(appReadyEvent);
        
        console.log('Application initialization completed');
    }
    
    // Create fallbacks for essential modules
    function createFallbacks() {
        // Create StorageManager fallback if missing
        if (!window.StorageManager) {
            console.warn('Creating StorageManager fallback');
            window.StorageManager = {
                getChats: function() { 
                    try {
                        return JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}'); 
                    } catch (e) {
                        return {};
                    }
                },
                saveChats: function(chats) { 
                    localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats)); 
                },
                saveSidebarState: function(isHidden) { 
                    localStorage.setItem('sidebar_state', isHidden ? 'true' : 'false'); 
                },
                getSidebarState: function() { 
                    return localStorage.getItem('sidebar_state') === 'true'; 
                },
                saveTheme: function(theme) { 
                    localStorage.setItem('theme', theme); 
                },
                getTheme: function() { 
                    return localStorage.getItem('theme'); 
                }
            };
        }
        
        // Create MessageComponent fallback if missing
        if (!window.MessageComponent) {
            console.warn('Creating MessageComponent fallback');
            window.MessageComponent = {
                displayMessage: function(text, sender) {
                    const messagesContainer = document.getElementById('messages-container');
                    if (!messagesContainer) return;
                    
                    const messageEl = document.createElement('div');
                    messageEl.className = `message-row ${sender}-row`;
                    messageEl.innerHTML = `
                        <div class="message ${sender}-message">
                            <div class="message-avatar">
                                <i class="${sender === 'user' ? 'fas fa-user' : 'fas fa-concierge-bell'}"></i>
                            </div>
                            <div class="message-content">${text}</div>
                        </div>
                    `;
                    
                    messagesContainer.appendChild(messageEl);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                },
                
                showTypingIndicator: function() {
                    const messagesContainer = document.getElementById('messages-container');
                    if (!messagesContainer) return;
                    
                    const indicatorRow = document.createElement('div');
                    indicatorRow.className = 'message-row bot-row';
                    indicatorRow.id = 'typing-indicator-row';
                    
                    indicatorRow.innerHTML = `
                        <div class="message bot-message">
                            <div class="message-avatar">
                                <i class="fas fa-concierge-bell"></i>
                            </div>
                            <div class="message-content typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    `;
                    
                    messagesContainer.appendChild(indicatorRow);
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                },
                
                removeTypingIndicator: function() {
                    const indicator = document.getElementById('typing-indicator-row');
                    if (indicator) indicator.remove();
                }
            };
        }
        
        // Create ChatAPI fallback if missing
        if (!window.ChatAPI) {
            console.warn('Creating ChatAPI fallback');
            window.ChatAPI = {
                initializeSession: function() {
                    return Promise.resolve('local-session-' + Date.now());
                },
                
                sendMessage: function(message) {
                    console.log('ChatAPI fallback: sending message', message);
                    return Promise.resolve("Mi scusi, il sistema è attualmente in modalità offline. Per favore contatti il supporto tecnico.");
                },
                
                clearHistory: function() {
                    return Promise.resolve({ success: true });
                },
                
                getHistory: function() {
                    return Promise.resolve([]);
                }
            };
        }
        
        // Create ChatCore fallback if missing
        if (!window.ChatCore) {
            console.warn('Creating ChatCore fallback');
            window.ChatCore = {
                state: {
                    currentChatId: null,
                    isWaitingForResponse: false
                },
                
                initialize: function() {
                    console.log('ChatCore fallback initialized');
                    this.createNewChat();
                },
                
                createNewChat: function() {
                    console.log('Creating new chat (fallback)');
                    this.state.currentChatId = 'chat_' + Date.now();
                    
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        messagesContainer.innerHTML = '';
                        
                        // Add welcome message
                        const welcomeMsg = "Benvenuto! Questo è un messaggio di fallback. Il sistema è in modalità limitata.";
                        if (window.MessageComponent) {
                            window.MessageComponent.displayMessage(welcomeMsg, 'bot');
                        }
                    }
                    
                    // Update sidebar if available
                    if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
                        window.SidebarComponent.updateChatList(this.state.currentChatId);
                    }
                },
                
                handleMessageSubmit: function(message) {
                    if (!message || this.state.isWaitingForResponse) return;
                    
                    // Display user message
                    if (window.MessageComponent) {
                        window.MessageComponent.displayMessage(message, 'user');
                    }
                    
                    // Save message
                    const chats = window.StorageManager ? window.StorageManager.getChats() : {};
                    const chat = chats[this.state.currentChatId] || {
                        messages: [],
                        timestamp: new Date().toISOString(),
                        title: message.length > 20 ? message.substring(0, 17) + '...' : message
                    };
                    
                    chat.messages.push({ sender: 'user', text: message });
                    chat.timestamp = new Date().toISOString();
                    
                    chats[this.state.currentChatId] = chat;
                    if (window.StorageManager) {
                        window.StorageManager.saveChats(chats);
                    }
                    
                    // Show typing indicator
                    this.state.isWaitingForResponse = true;
                    if (window.MessageComponent) {
                        window.MessageComponent.showTypingIndicator();
                    }
                    
                    // Simulate response after delay
                    const responseDelay = 1000 + Math.random() * 1000;
                    setTimeout(() => {
                        if (window.MessageComponent) {
                            window.MessageComponent.removeTypingIndicator();
                        }
                        
                        const botResponse = "Risposta di fallback. Il sistema è in modalità limitata.";
                        
                        if (window.MessageComponent) {
                            window.MessageComponent.displayMessage(botResponse, 'bot');
                        }
                        
                        // Save bot message
                        chat.messages.push({ sender: 'bot', text: botResponse });
                        chats[this.state.currentChatId] = chat;
                        
                        if (window.StorageManager) {
                            window.StorageManager.saveChats(chats);
                        }
                        
                        this.state.isWaitingForResponse = false;
                    }, responseDelay);
                }
            };
        }
    }
    
    // Set up global event handlers for critical functionality
    function setupGlobalEventHandlers() {
        console.log('Setting up global event handlers');
        
        // Setup chat form handler
        setupChatForm();
    }
    
    // Set up chat form submission with robust error handling
    function setupChatForm() {
        try {
            const chatForm = document.getElementById('chat-form');
            if (!chatForm) {
                console.error('Chat form not found');
                return;
            }
            
            // Remove existing listeners by cloning
            const newForm = chatForm.cloneNode(true);
            if (chatForm.parentNode) {
                chatForm.parentNode.replaceChild(newForm, chatForm);
            }
            
            newForm.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const messageInput = document.getElementById('message-input');
                if (!messageInput || !messageInput.value.trim()) return false;
                
                const message = messageInput.value.trim();
                console.log('Form submitted with message:', message);
                
                // Clear input field
                messageInput.value = '';
                
                // Use ChatCore to handle the message if available
                if (window.ChatCore && typeof window.ChatCore.handleMessageSubmit === 'function') {
                    try {
                        window.ChatCore.handleMessageSubmit(message);
                    } catch (error) {
                        console.error('Error in ChatCore.handleMessageSubmit:', error);
                        // Fallback to basic display
                        handleMessageFallback(message);
                    }
                } else {
                    // Fallback if ChatCore not available
                    console.warn('ChatCore not available, using fallback');
                    handleMessageFallback(message);
                }
                
                return false;
            });
            
            console.log('Chat form handler set up successfully');
        } catch (error) {
            console.error('Error setting up chat form:', error);
        }
    }
    
    // Fallback message handler
    function handleMessageFallback(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;
        
        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'message-row user-row';
        userMsg.innerHTML = `
            <div class="message user-message">
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="message-content">${message}</div>
            </div>
        `;
        messagesContainer.appendChild(userMsg);
        
        // Add bot response after delay
        setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'message-row bot-row';
            botMsg.innerHTML = `
                <div class="message bot-message">
                    <div class="message-avatar">
                        <i class="fas fa-concierge-bell"></i>
                    </div>
                    <div class="message-content">
                        Mi dispiace, il sistema di chat non è completamente caricato.
                        Ricarica la pagina per utilizzare tutte le funzionalità.
                    </div>
                </div>
            `;
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);
    }
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllModules);
    } else {
        loadAllModules();
    }
  })();