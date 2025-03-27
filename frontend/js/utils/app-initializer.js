// frontend/js/utils/app-initializer.js
// Centralized initialization logic

const AppInitializer = {
    /**
     * Dependencies status
     */
    dependencies: {
      domReady: false,
      componentsLoaded: false,
      storageReady: false,
      sidebarReady: false, 
      chatApiReady: false
    },
    
    /**
     * Init called from main.js
     */
    init: function() {
      console.log('AppInitializer: Starting initialization process');
      
      // Set up dependency tracking
      this.checkDependencies();
      
      // Add event listeners for dependency events
      document.addEventListener('componentsLoaded', () => {
        this.dependencies.componentsLoaded = true;
        this.checkDependencies();
      });
      
      // If DOM is already loaded, mark as ready
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.dependencies.domReady = true;
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          this.dependencies.domReady = true;
          this.checkDependencies();
        });
      }
      
      // Check if storage module is loaded
      if (window.StorageManager) {
        this.dependencies.storageReady = true;
      }
      
      // Check if ChatAPI is loaded
      if (window.ChatAPI) {
        this.dependencies.chatApiReady = true; 
      }
      
      // Check if SidebarComponent is loaded
      if (window.SidebarComponent) {
        this.dependencies.sidebarReady = true;
      }
      
      // Final verification
      setTimeout(() => this.checkDependencies(), 1000);
    },
    
    /**
     * Check if all dependencies are loaded and start app when ready
     */
    checkDependencies: function() {
      console.log('AppInitializer: Checking dependencies', this.dependencies);
      
      // Create any missing dependencies with fallbacks
      this.createFallbacks();
      
      // If all dependencies are ready, start the application
      if (this.dependencies.domReady && 
          this.dependencies.componentsLoaded &&
          this.dependencies.storageReady &&
          this.dependencies.sidebarReady &&
          this.dependencies.chatApiReady) {
        this.startApplication();
      }
    },
    
    /**
     * Create fallbacks for essential components if not loaded
     */
    createFallbacks: function() {
      // Create StorageManager fallback if missing
      if (!window.StorageManager) {
        console.warn('Creating StorageManager fallback');
        window.StorageManager = {
          getChats: function() { return JSON.parse(localStorage.getItem('villa_petriolo_chats') || '{}'); },
          saveChats: function(chats) { localStorage.setItem('villa_petriolo_chats', JSON.stringify(chats)); },
          saveSidebarState: function(isHidden) { localStorage.setItem('sidebar_state', isHidden ? 'true' : 'false'); },
          getSidebarState: function() { return localStorage.getItem('sidebar_state') === 'true'; },
          saveTheme: function(theme) { localStorage.setItem('theme', theme); },
          getTheme: function() { return localStorage.getItem('theme'); }
        };
        this.dependencies.storageReady = true;
      }
      
      // Create SidebarComponent fallback if missing
      if (!window.SidebarComponent) {
        console.warn('Creating SidebarComponent fallback');
        window.SidebarComponent = {
          updateChatList: function(currentChatId) {
            console.log('SidebarComponent fallback: updateChatList for', currentChatId);
            // Minimal implementation to update chat list
            const sidebarChats = document.getElementById('sidebar-chats');
            if (!sidebarChats) return;
            
            const chats = window.StorageManager.getChats();
            const chatIds = Object.keys(chats).sort((a, b) => {
              return new Date(chats[b].timestamp) - new Date(chats[a].timestamp);
            });
            
            sidebarChats.innerHTML = '';
            
            chatIds.forEach(chatId => {
              const chat = chats[chatId];
              const chatEl = document.createElement('div');
              chatEl.className = `chat-item ${chatId === currentChatId ? 'active' : ''}`;
              
              chatEl.innerHTML = `
                <div class="chat-item-content" data-id="${chatId}">
                  <div class="chat-item-title">${chat.title || 'Nuova conversazione'}</div>
                  <div class="chat-item-date">${new Date(chat.timestamp).toLocaleDateString()}</div>
                </div>
                <button class="delete-chat-btn" data-id="${chatId}" type="button">
                  <i class="fas fa-trash"></i>
                </button>
              `;
              
              sidebarChats.appendChild(chatEl);
            });
          },
          
          openSidebar: function() {
            document.body.classList.add('sidebar-open');
          },
          
          closeSidebar: function() {
            document.body.classList.remove('sidebar-open');
          }
        };
        this.dependencies.sidebarReady = true;
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
            // Simple fallback to simulate response
            return "Mi scusi, il sistema è attualmente in modalità offline. Per favore contatti il supporto tecnico di Villa Petriolo.";
          },
          
          clearHistory: async function() {
            return { success: true, message: 'History cleared (local fallback)' };
          },
          
          getHistory: async function() {
            return [];
          }
        };
        this.dependencies.chatApiReady = true;
      }
    },
    
    /**
     * Start the application when all dependencies are loaded
     */
    startApplication: function() {
      console.log('AppInitializer: All dependencies loaded, starting application');
      
      // Initialize the chat core
      if (window.ChatCore && typeof window.ChatCore.initialize === 'function') {
        window.ChatCore.initialize();
      }
      
      // Set up form submission handling
      this.setupFormHandling();
      
      // Set up UI event listeners
      this.setupEventListeners();
      
      // Trigger app ready event
      const appReadyEvent = new Event('appReady');
      document.dispatchEvent(appReadyEvent);
      
      console.log('AppInitializer: Application started successfully');
    },
    
    /**
     * Set up form submission handling
     */
    setupFormHandling: function() {
      const chatForm = document.getElementById('chat-form');
      if (chatForm) {
        // Remove existing handlers
        const newForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(newForm, chatForm);
        
        // Add new handler
        newForm.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const messageInput = document.getElementById('message-input');
          if (!messageInput || !messageInput.value.trim()) return;
          
          const userMessage = messageInput.value.trim();
          
          if (window.ChatCore && typeof window.ChatCore.handleMessageSubmit === 'function') {
            window.ChatCore.handleMessageSubmit(userMessage);
          } else {
            console.error('ChatCore not available or handleMessageSubmit method not found');
            alert('Errore: impossibile inviare il messaggio');
          }
        });
        
        console.log('AppInitializer: Chat form handler set up');
      }
    },
    
    /**
     * Set up all event listeners
     */
    setupEventListeners: function() {
      // Set up new chat button
      const newChatBtn = document.getElementById('new-chat-btn');
      if (newChatBtn) {
        const newBtn = newChatBtn.cloneNode(true);
        newChatBtn.parentNode.replaceChild(newBtn, newChatBtn);
        
        newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          if (window.ChatCore && typeof window.ChatCore.createNewChat === 'function') {
            window.ChatCore.createNewChat();
          } else {
            console.error('ChatCore not available or createNewChat method not found');
            window.location.reload();
          }
        });
      }
      
      // Set up mobile sidebar toggle
      const sidebarToggle = document.getElementById('sidebar-toggle');
      if (sidebarToggle) {
        const newToggle = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
        
        newToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          if (document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
          } else {
            document.body.classList.add('sidebar-open');
          }
        });
      }
      
      // Set up global handler for delete buttons
      document.addEventListener('click', function(e) {
        let target = e.target;
        let isDeleteButton = false;
        
        // Find if we clicked on a delete button or its icon
        while (target && target !== document) {
          if (target.classList && 
              (target.classList.contains('delete-chat-btn') || 
               target.classList.contains('fa-trash'))) {
            isDeleteButton = true;
            break;
          }
          target = target.parentNode;
        }
        
        if (!isDeleteButton) return;
        
        // Found a delete button
        e.preventDefault();
        e.stopPropagation();
        
        // If we clicked the icon, find the button
        if (target.classList.contains('fa-trash')) {
          while (target && !target.classList.contains('delete-chat-btn')) {
            target = target.parentNode;
          }
        }
        
        if (!target) return;
        
        // Get chat ID
        const chatId = target.getAttribute('data-id');
        if (!chatId) return;
        
        // Confirm deletion
        if (confirm('Sei sicuro di voler eliminare questa chat?')) {
          try {
            if (window.ChatCore && typeof window.ChatCore.deleteChat === 'function') {
              window.ChatCore.deleteChat(chatId);
            } else {
              // Fallback implementation
              const chats = window.StorageManager.getChats();
              delete chats[chatId];
              window.StorageManager.saveChats(chats);
              
              // If there are no more chats, reload the page
              if (Object.keys(chats).length === 0) {
                window.location.reload();
              } else {
                // Update the sidebar
                if (window.SidebarComponent && typeof window.SidebarComponent.updateChatList === 'function') {
                  window.SidebarComponent.updateChatList(Object.keys(chats)[0]);
                }
              }
            }
          } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Si è verificato un errore durante l\'eliminazione della chat');
          }
        }
      });
      
      console.log('AppInitializer: Event listeners set up');
    }
  };
  
  // Export the module
  window.AppInitializer = AppInitializer;