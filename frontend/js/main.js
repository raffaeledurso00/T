// Fix for async function syntax error in main.js
// This fix targets the loadAllModules function that might be causing issues

/**
 * Load all module groups in sequence
 */
async function loadAllModules() {
    for (const group of moduleGroups) {
        await loadModuleGroup(group);
    }
    
    // All modules loaded, initialize application
    initializeApplication();
}

/**
 * Handle message submission with proper error handling
 */
function handleMessageSubmitFallback(message) {
    console.log('Using fallback message handler for:', message);
    
    // Get current chat ID
    const chatId = localStorage.getItem('villa_petriolo_session_id') || ('chat_' + Date.now());
    
    // Add user message to UI
    if (window.MessageComponent) {
        window.MessageComponent.displayMessage(message, 'user');
        window.MessageComponent.showTypingIndicator();
    } else {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            const userMsg = document.createElement('div');
            userMsg.className = 'message-row user-row';
            userMsg.innerHTML = `
                <div class="message user-message">
                    <div class="message-avatar"><i class="fas fa-user"></i></div>
                    <div class="message-content">${message}</div>
                </div>
            `;
            messagesContainer.appendChild(userMsg);
            
            // Simple typing indicator
            const indicator = document.createElement('div');
            indicator.id = 'typing-indicator-row';
            indicator.className = 'message-row bot-row';
            indicator.innerHTML = `
                <div class="message bot-message">
                    <div class="message-avatar"><i class="fas fa-concierge-bell"></i></div>
                    <div class="message-content">...</div>
                </div>
            `;
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    // Save to storage
    const chats = JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}');
    const chat = chats[chatId] || {
        messages: [],
        timestamp: new Date().toISOString(),
        title: message.substring(0, 20) + (message.length > 20 ? '...' : '')
    };
    
    chat.messages.push({
        sender: 'user',
        text: message
    });
    
    // Update timestamp
    chat.timestamp = new Date().toISOString();
    chats[chatId] = chat;
    localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats));
    
    // Create realistic delay
    const delay = 1000 + Math.random() * 2000;
    
    // Get response after delay
    setTimeout(function() {
        let response;
        
        try {
            if (window.ChatAPI && typeof window.ChatAPI.sendMessage === 'function') {
                // Use non-async version
                window.ChatAPI.sendMessage(message, chatId).then(function(result) {
                    // Remove typing indicator
                    if (window.MessageComponent) {
                        window.MessageComponent.removeTypingIndicator();
                        window.MessageComponent.displayMessage(result, 'bot');
                    } else {
                        const indicator = document.getElementById('typing-indicator-row');
                        if (indicator) indicator.remove();
                        
                        const messagesContainer = document.getElementById('messages-container');
                        if (messagesContainer) {
                            const botMsg = document.createElement('div');
                            botMsg.className = 'message-row bot-row';
                            botMsg.innerHTML = `
                                <div class="message bot-message">
                                    <div class="message-avatar"><i class="fas fa-concierge-bell"></i></div>
                                    <div class="message-content">${result}</div>
                                </div>
                            `;
                            messagesContainer.appendChild(botMsg);
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    }
                    
                    // Add bot message to storage
                    chat.messages.push({
                        sender: 'bot',
                        text: result
                    });
                    
                    chats[chatId] = chat;
                    localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats));
                    
                    // Update sidebar
                    if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
                        window.SidebarComponent.updateChatList(chatId);
                    }
                }).catch(function(error) {
                    console.error('Error getting response:', error);
                    response = "Si è verificato un errore nel processare la richiesta. Riprovi più tardi.";
                    
                    // Handle error case
                    if (window.MessageComponent) {
                        window.MessageComponent.removeTypingIndicator();
                        window.MessageComponent.displayMessage(response, 'bot');
                    }
                });
            } else {
                response = "Mi scusi, il sistema è attualmente in modalità offline. Per favore contatti il supporto tecnico.";
                
                // Handle offline case
                if (window.MessageComponent) {
                    window.MessageComponent.removeTypingIndicator();
                    window.MessageComponent.displayMessage(response, 'bot');
                }
            }
        } catch (error) {
            console.error('Error getting response:', error);
            response = "Si è verificato un errore nel processare la richiesta. Riprovi più tardi.";
            
            // Handle exception case
            if (window.MessageComponent) {
                window.MessageComponent.removeTypingIndicator();
                window.MessageComponent.displayMessage(response, 'bot');
            }
        }
    }, delay);
}