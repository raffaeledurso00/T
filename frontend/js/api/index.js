// Main index.js file that sets up the chat UI and functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Define the UI Manager object
    const uiManager = {
        updateChatList: function(messages) {
            const chatList = document.getElementById('chat-messages');
            if (!chatList) {
                console.error('Chat messages container not found');
                return;
            }
            
            // Clear existing messages
            chatList.innerHTML = '';
            
            // Add each message
            messages.forEach(msg => {
                const messageEl = document.createElement('div');
                messageEl.className = `message ${msg.sender.toLowerCase()}`;
                messageEl.innerHTML = `
                    <div class="message-content">
                        <strong>${msg.sender}:</strong> ${msg.text}
                    </div>
                    <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                `;
                chatList.appendChild(messageEl);
            });
            
            // Scroll to bottom
            chatList.scrollTop = chatList.scrollHeight;
        },
        
        showLoading: function() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            
            // Disable send button
            const sendButton = document.getElementById('send-button');
            if (sendButton) sendButton.disabled = true;
        },
        
        hideLoading: function() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Enable send button
            const sendButton = document.getElementById('send-button');
            if (sendButton) sendButton.disabled = false;
        },
        
        showError: function(message) {
            console.error("Chat error:", message);
            
            // Show error in UI
            const errorContainer = document.getElementById('error-container');
            if (errorContainer) {
                errorContainer.textContent = message;
                errorContainer.style.display = 'block';
                
                // Hide after 5 seconds
                setTimeout(() => {
                    errorContainer.style.display = 'none';
                }, 5000);
            } else {
                // Fallback to alert if container doesn't exist
                alert(`Errore: ${message}`);
            }
        }
    };
    
    // Initialize chat module with UI manager
    try {
        // Make sure ChatModule exists
        if (typeof ChatModule === 'undefined') {
            console.error('ChatModule is not defined. Check if chat.js is loaded correctly.');
            return;
        }
        
        // Initialize the chat module
        const chatController = ChatModule.initialize(uiManager);
        
        // Set up event listeners
        const chatForm = document.getElementById('chat-form');
        const messageInput = document.getElementById('message-input');
        const clearButton = document.getElementById('clear-button');
        
        if (chatForm && messageInput) {
            chatForm.addEventListener('submit', function(event) {
                // Prevent normal form submission
                event.preventDefault();
                console.log('Emergency submit prevention');
                
                // Get message text
                const message = messageInput.value.trim();
                
                // Don't submit empty messages
                if (message === '') {
                    return;
                }
                
                // Process the message
                try {
                    chatController.handleMessageSubmit(message);
                    
                    // Clear input field
                    messageInput.value = '';
                    
                    // Focus back on input
                    messageInput.focus();
                } catch (error) {
                    console.error('Error handling message submission:', error);
                    uiManager.showError('Non è stato possibile inviare il messaggio');
                }
            });
        } else {
            console.error('Chat form or message input not found');
        }
        
        // Set up clear chat button
        if (clearButton) {
            clearButton.addEventListener('click', function() {
                try {
                    chatController.clearChat();
                } catch (error) {
                    console.error('Error clearing chat:', error);
                    uiManager.showError('Non è stato possibile cancellare la chat');
                }
            });
        }
        
        console.log('Chat functionality initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chat:', error);
        
        // Show error in UI
        const errorContainer = document.getElementById('error-container') || document.body;
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Non è stato possibile inizializzare la chat. Ricarica la pagina.';
        errorMessage.style.color = 'red';
        errorMessage.style.padding = '10px';
        errorMessage.style.margin = '10px 0';
        errorMessage.style.border = '1px solid red';
        errorContainer.appendChild(errorMessage);
    }
    
    // Initialize suggestion chips
    setupSuggestionChips();
});

// Set up suggestion chips
function setupSuggestionChips() {
    const suggestions = [
        "Quali servizi offre la villa?",
        "Vorrei prenotare una cena",
        "Come posso prenotare un'attività?",
        "Quali sono gli orari della spa?"
    ];
    
    const suggestionsContainer = document.getElementById('suggestion-chips');
    if (!suggestionsContainer) return;
    
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.addEventListener('click', function() {
            // Find the message input and populate it
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = suggestion;
                messageInput.focus();
            }
            
            // Optional: Submit form automatically
            const sendButton = document.getElementById('send-button');
            if (sendButton) {
                sendButton.click();
            }
        });
        
        suggestionsContainer.appendChild(chip);
    });
    
    console.log(`Found ${suggestions.length} suggestion chips`);
    
    // Let other scripts know suggestions are done
    const event = new CustomEvent('suggestionsReady');
    document.dispatchEvent(event);
    console.log('Welcome suggestions setup completed');
}