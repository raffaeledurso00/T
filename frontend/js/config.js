// frontend/js/config.js
// Configurazione globale dell'applicazione
const config = {
    // API Configuration
    BACKEND_URL: 'http://localhost:3001',
    API_TIMEOUT: 10000,

    // Storage keys
    STORAGE_KEYS: {
        SESSION_ID: 'chat_session_id',
        CHAT_HISTORY: 'chat_history',
        CURRENT_CHAT: 'current_chat',
        THEME: 'ui_theme'
    },

    // Chat configuration
    CHAT: {
        MAX_HISTORY: 50,
        CLEANUP_INTERVAL: 3600000, // 1 hour
        MESSAGE_TYPES: {
            USER: 'user',
            ASSISTANT: 'assistant',
            SYSTEM: 'system'
        }
    },

    // UI Configuration
    UI: {
        ANIMATION_DURATION: 300,
        MOBILE_BREAKPOINT: 768,
        THEME: {
            LIGHT: 'light',
            DARK: 'dark'
        }
    }
};

// Make config available globally
window.config = config;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

const appConfig = {
    // API Configuration
    BACKEND_URL: 'http://localhost:3001',
    API_TIMEOUT: 10000,

    // Storage keys
    STORAGE_KEYS: {
        SESSION_ID: 'villa_petriolo_session_id',
        CHATS: 'villa_petriolo_chats',
        SIDEBAR_STATE: 'villa_petriolo_sidebar_state',
        THEME: 'villa_petriolo_theme'
    }
};

// Make config available globally
window.appConfig = appConfig;