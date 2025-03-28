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
            'js/utils/dom.js'
        ]
    },
    {
        name: 'api',
        files: ['js/api/chat.js']
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
    },
  
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
  async function loadModuleGroup(group) {
      console.log(`Loading module group: ${group.name}`);
      
      try {
          // Load all scripts in the group
          for (const file of group.files) {
              await loadScript(file);
          }
          
          // Mark group as loaded
          loadedModules[group.name] = true;
          console.log(`Module group loaded: ${group.name}`);
          
          // Dispatch event for module group loaded
          const event = new CustomEvent(`${group.name}Loaded`);
          document.dispatchEvent(event);
          
          return true;
      } catch (error) {
          console.error(`Error loading module group ${group.name}:`, error);
          return false;
      }
  }
  
  // Load all module groups in sequence
  async function loadAllModules() {
      for (const group of moduleGroups) {
          await loadModuleGroup(group);
      }
      
      // All modules loaded, initialize application
      initializeApplication();
  }
  
  // Initialize application after all modules are loaded
  function initializeApplication() {
      console.log('All modules loaded, initializing application...');
      
      // Create fallbacks for essential modules if not loaded
      createFallbacks();
      
      // Setup global event handlers
      setupGlobalEventHandlers();
      
      // Initialize core components
      initializeCoreComponents();
      
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
              initializeSession: async function() {
                  return 'local-session-' + Date.now();
              },
              
              sendMessage: async function(message) {
                  console.log('ChatAPI fallback: sending message', message);
                  return "Mi scusi, il sistema è attualmente in modalità offline. Per favore contatti il supporto tecnico.";
              },
              
              clearHistory: async function() {
                  return { success: true };
              },
              
              getHistory: async function() {
                  return [];
              }
          };
      }
  }
  
  // Set up global event handlers for critical functionality
  function setupGlobalEventHandlers() {
      console.log('Setting up global event handlers');
      
      // Set up chat form submission
      setupChatForm();
      
      // Set up robust delete button handler
      setupDeleteButtonHandler();
      
      // Set up new chat button
      setupNewChatButton();
      
      // Set up sidebar toggle
      setupSidebarToggle();
  }
  
  // Set up chat form submission
  function setupChatForm() {
      const chatForm = document.getElementById('chat-form');
      if (!chatForm) {
          console.error('Chat form not found');
          return;
      }
      
      // Remove any existing event handlers
      const newForm = chatForm.cloneNode(true);
      chatForm.parentNode.replaceChild(newForm, chatForm);
      
      // Add new submit handler
      newForm.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const messageInput = document.getElementById('message-input');
          if (!messageInput || !messageInput.value.trim()) return;
          
          const message = messageInput.value.trim();
          
          if (window.ChatCore && typeof window.ChatCore.handleMessageSubmit === 'function') {
              window.ChatCore.handleMessageSubmit(message);
          } else {
              // Fallback implementation
              handleMessageSubmitFallback(message);
          }
          
          // Clear input field
          messageInput.value = '';
      });
      
      console.log('Chat form handler set up');
  }
  
  // Fallback function for message submission
  async function handleMessageSubmitFallback(message) {
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
      setTimeout(async () => {
          let response;
          
          try {
              if (window.ChatAPI && typeof window.ChatAPI.sendMessage === 'function') {
                  response = await window.ChatAPI.sendMessage(message, chatId);
              } else {
                  response = "Mi scusi, il sistema è attualmente in modalità offline. Per favore contatti il supporto tecnico.";
              }
          } catch (error) {
              console.error('Error getting response:', error);
              response = "Si è verificato un errore nel processare la richiesta. Riprovi più tardi.";
          }
          
          // Remove typing indicator
          if (window.MessageComponent) {
              window.MessageComponent.removeTypingIndicator();
              window.MessageComponent.displayMessage(response, 'bot');
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
                          <div class="message-content">${response}</div>
                      </div>
                  `;
                  messagesContainer.appendChild(botMsg);
                  messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
          }
          
          // Add bot message to storage
          chat.messages.push({
              sender: 'bot',
              text: response
          });
          
          chats[chatId] = chat;
          localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats));
          
          // Update sidebar
          if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
              window.SidebarComponent.updateChatList(chatId);
          }
      }, delay);
  }
  
  // Set up robust delete button handler
  function setupDeleteButtonHandler() {
      // Remove any existing global handler
      if (window._deleteButtonHandler) {
          document.removeEventListener('click', window._deleteButtonHandler);
      }
      
      // Create new handler
      window._deleteButtonHandler = function(e) {
          // Find if clicked element is delete button or trash icon
          let target = e.target;
          let isDeleteButton = false;
          
          // Check if target is delete button or trash icon
          while (target && target !== document) {
              if (target.classList && 
                  (target.classList.contains('delete-chat-btn') || 
                   target.classList.contains('fa-trash'))) {
                  isDeleteButton = true;
                  break;
              }
              target = target.parentNode;
          }
          
          // If not a delete button, exit
          if (!isDeleteButton) return;
          
          // If we clicked trash icon, find the parent button
          if (target.classList.contains('fa-trash')) {
              let parentButton = target;
              while (parentButton && !parentButton.classList.contains('delete-chat-btn')) {
                  parentButton = parentButton.parentNode;
              }
              
              if (parentButton) {
                  target = parentButton;
              } else {
                  console.error('Could not find parent delete button');
                  return;
              }
          }
          
          // Get chat ID
          const chatId = target.getAttribute('data-id');
          if (!chatId) {
              console.error('No chat ID found on delete button');
              return;
          }
          
          // Stop event propagation and prevent default
          e.stopPropagation();
          e.preventDefault();
          
          console.log('Delete button clicked for chat ID:', chatId);
          
          // Confirm deletion
          if (confirm('Sei sicuro di voler eliminare questa chat?')) {
              deleteChat(chatId);
          }
      };
      
      // Add global handler
      document.addEventListener('click', window._deleteButtonHandler);
      console.log('Delete button handler set up');
  }
  
  // Function to delete a chat
  function deleteChat(chatId) {
      console.log('Deleting chat:', chatId);
      
      try {
          // Use ChatCore if available
          if (window.ChatCore && typeof window.ChatCore.deleteChat === 'function') {
              window.ChatCore.deleteChat(chatId);
              return;
          }
          
          // Otherwise, implement deletion directly
          const chats = JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}');
          if (!chats[chatId]) {
              console.error('Chat not found:', chatId);
              return;
          }
          
          // Get current chat ID
          const currentChatId = window.ChatCore?.state?.currentChatId || 
                               localStorage.getItem('currentChatId');
          
          // Delete the chat
          delete chats[chatId];
          localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats));
          
          // If deleted the current chat, create a new one or load another
          if (chatId === currentChatId) {
              const remainingChatIds = Object.keys(chats);
              
              if (remainingChatIds.length > 0) {
                  // Load another chat
                  if (window.ChatCore && typeof window.ChatCore.loadChat === 'function') {
                      window.ChatCore.loadChat(remainingChatIds[0]);
                  } else {
                      // Simple chat loading
                      loadChatFallback(remainingChatIds[0]);
                  }
              } else {
                  // Create new chat
                  if (window.ChatCore && typeof window.ChatCore.createNewChat === 'function') {
                      window.ChatCore.createNewChat();
                  } else {
                      // Simple chat creation
                      createNewChatFallback();
                  }
              }
          } else {
              // Just update sidebar
              if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
                  window.SidebarComponent.updateChatList(currentChatId);
              }
          }
      } catch (error) {
          console.error('Error deleting chat:', error);
          alert('Si è verificato un errore durante l\'eliminazione della chat. Ricarica la pagina e riprova.');
      }
  }
  
  // Fallback function to load a chat
  function loadChatFallback(chatId) {
      console.log('Loading chat (fallback):', chatId);
      
      const chats = JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}');
      const chat = chats[chatId];
      
      if (!chat) {
          console.error('Chat not found:', chatId);
          return;
      }
      
      // Update current chat ID
      localStorage.setItem('currentChatId', chatId);
      
      // Clear messages container
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
          messagesContainer.innerHTML = '';
          
          // Add messages
          chat.messages.forEach(msg => {
              const messageRow = document.createElement('div');
              messageRow.className = `message-row ${msg.sender}-row`;
              messageRow.innerHTML = `
                  <div class="message ${msg.sender}-message">
                      <div class="message-avatar">
                          <i class="${msg.sender === 'user' ? 'fas fa-user' : 'fas fa-concierge-bell'}"></i>
                      </div>
                      <div class="message-content">${msg.text}</div>
                  </div>
              `;
              
              messagesContainer.appendChild(messageRow);
          });
          
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      // Update sidebar
      if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
          window.SidebarComponent.updateChatList(chatId);
      }
  }
  
  // Fallback function to create a new chat
  function createNewChatFallback() {
      console.log('Creating new chat (fallback)');
      
      // Generate new chat ID
      const chatId = 'chat_' + Date.now();
      localStorage.setItem('currentChatId', chatId);
      
      // Create new chat
      const chats = JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}');
      chats[chatId] = {
          messages: [],
          timestamp: new Date().toISOString(),
          title: 'Nuova conversazione'
      };
      
      localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats));
      
      // Clear messages container
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
          messagesContainer.innerHTML = '';
          
          // Add welcome message
          const welcomeDiv = document.createElement('div');
          welcomeDiv.className = 'welcome-message';
          welcomeDiv.innerHTML = `
              <h2>Benvenuto al Concierge Digitale di Villa Petriolo</h2>
              <p>Sono qui per aiutarti con:</p>
              <div class="suggestion-chips">
                  <button class="suggestion-chip" data-message="Quali sono gli orari del ristorante?">
                      <i class="fas fa-utensils"></i> Ristorante
                  </button>
                  <button class="suggestion-chip" data-message="Che attività posso fare oggi?">
                      <i class="fas fa-hiking"></i> Attività
                  </button>
                  <button class="suggestion-chip" data-message="Quali eventi sono in programma?">
                      <i class="fas fa-calendar-alt"></i> Eventi
                  </button>
                  <button class="suggestion-chip" data-message="Come posso prenotare un servizio?">
                      <i class="fas fa-concierge-bell"></i> Servizi
                  </button>
              </div>
          `;
          
          messagesContainer.appendChild(welcomeDiv);
          
          // Setup suggestion chips
          setupWelcomeSuggestions(welcomeDiv);
      }
      
      // Update sidebar
      if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
          window.SidebarComponent.updateChatList(chatId);
      }
  }
  
  // Set up welcome suggestions
  function setupWelcomeSuggestions(welcomeMessage) {
      if (!welcomeMessage) return;
      
      const suggestionChips = welcomeMessage.querySelectorAll('.suggestion-chip');
      
      suggestionChips.forEach(chip => {
          chip.addEventListener('click', function() {
              const message = this.getAttribute('data-message');
              if (!message) return;
              
              // Use ChatCore if available
              if (window.ChatCore && typeof window.ChatCore.handleMessageSubmit === 'function') {
                  window.ChatCore.handleMessageSubmit(message);
              } else {
                  // Use fallback
                  handleMessageSubmitFallback(message);
              }
          });
      });
  }
  
  // Set up new chat button
  function setupNewChatButton() {
      const newChatBtn = document.getElementById('new-chat-btn');
      if (!newChatBtn) {
          console.error('New chat button not found');
          return;
      }
      
      // Remove any existing event handlers
      const newBtn = newChatBtn.cloneNode(true);
      newChatBtn.parentNode.replaceChild(newBtn, newChatBtn);
      
      // Add new click handler
      newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('New chat button clicked');
          
          if (window.ChatCore && typeof window.ChatCore.createNewChat === 'function') {
              window.ChatCore.createNewChat();
          } else {
              // Fallback implementation
              createNewChatFallback();
          }
      });
      
      console.log('New chat button handler set up');
  }
  
  // Set up sidebar toggle
  function setupSidebarToggle() {
      const sidebarToggle = document.getElementById('sidebar-toggle');
      if (!sidebarToggle) {
          console.error('Sidebar toggle not found');
          return;
      }
      
      // Remove any existing event handlers
      const newToggle = sidebarToggle.cloneNode(true);
      sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
      
      // Add new click handler
      newToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('Sidebar toggle clicked');
          
          // Toggle sidebar directly
          document.body.classList.toggle('sidebar-open');
      });
      
      // Set up sidebar overlay
      const sidebarOverlay = document.getElementById('sidebar-overlay');
      if (sidebarOverlay) {
          const newOverlay = sidebarOverlay.cloneNode(true);
          sidebarOverlay.parentNode.replaceChild(newOverlay, sidebarOverlay);
          
          newOverlay.addEventListener('click', function() {
              document.body.classList.remove('sidebar-open');
          });
      }
      
      console.log('Sidebar toggle handler set up');
  }
  
  // Initialize core components if available
  function initializeCoreComponents() {
      // Initialize ChatCore
      if (window.ChatCore && typeof window.ChatCore.initialize === 'function') {
          window.ChatCore.initialize();
      }
      
      // Initialize ResponsiveManager
      if (window.ResponsiveManager && typeof window.ResponsiveManager.init === 'function') {
          window.ResponsiveManager.init();
      }
      
      // Initialize SidebarToggleManager
      if (window.SidebarToggleManager && typeof window.SidebarToggleManager.init === 'function') {
          window.SidebarToggleManager.init();
      }
      
      console.log('Core components initialized');
  }
  
  // Start loading when DOM is ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAllModules);
  } else {
      loadAllModules();
  }
})();