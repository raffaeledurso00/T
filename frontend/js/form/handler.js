// frontend/js/form/handler.js

/**
 * Handles form submission with robust error handling
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Form Handler] Initialization');
        
        const form = document.getElementById('chat-form');
        if (!form) {
            console.error('[Form Handler] Form chat-form not found!');
            return;
        }
        
        console.log('[Form Handler] Form found, setting up handler');
        
        form.onsubmit = function(e) {
            console.log('[Form Handler] Form submitted');
            e.preventDefault();
            
            const input = document.getElementById('message-input');
            if (!input || !input.value.trim()) {
                console.log('[Form Handler] Empty input, no action');
                return false;
            }
            
            const message = input.value.trim();
            console.log('[Form Handler] Message to send:', message);
            input.value = '';
            
            if (window.ChatCore && typeof window.ChatCore.handleMessageSubmit === 'function') {
                console.log('[Form Handler] ChatCore found, sending message');
                try {
                    window.ChatCore.handleMessageSubmit(message);
                    console.log('[Form Handler] Message sent successfully');
                } catch (error) {
                    console.error('[Form Handler] Error during sending:', error);
                    
                    // Restore message in input field in case of error
                    input.value = message;
                }
            } else {
                console.error('[Form Handler] ChatCore not available!', {
                    chatCoreExists: !!window.ChatCore,
                    handleMessageSubmitExists: window.ChatCore ? typeof window.ChatCore.handleMessageSubmit : 'N/A'
                });
                
                // Restore message in input field
                input.value = message;
                
                // Show message to user
                alert('Si è verificato un errore. Ricarica la pagina e riprova.');
            }
            
            return false;
        };
        
        console.log('[Form Handler] Initialization completed');
    });
})();