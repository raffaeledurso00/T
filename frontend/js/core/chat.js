// frontend/js/core/chat.js
// Funzionalità core della chat

const ChatCore = {
    /**
     * Stato interno del modulo
     */
    state: {
      currentChatId: null,
      isWaitingForResponse: false
    },
    
    /**
     * Inizializza il modulo chat core
     */
/**
 * Inizializza il modulo chat core
 */
initialize: function() {
  console.log('Initializing chat core');
  
  // Crea sempre una nuova chat all'avvio
  this.createNewChat();

  // Inizializza il pulsante nuova chat
  this.setupNewChatButton();
},
    
    /**
     * Crea una nuova chat
     */
    createNewChat: function() {
      console.log('Creating new chat');
      
      // Generate ID
      this.state.currentChatId = 'chat_' + Date.now();
      
      const messagesContainer = document.getElementById('messages-container');
      if (!messagesContainer) return;
      
      // Clear messages area
      messagesContainer.innerHTML = '';
      
      // Mostra il messaggio di benvenuto
      this.showWelcomeMessage();
      
      // Reset context
      if (window.conversationContext) {
        window.conversationContext.reset();
      }
      
      // Update UI
      window.SidebarComponent.updateChatList(this.state.currentChatId);
      this.updateTopicIndicator(null);
      
      // Chiudi la sidebar su mobile
      if (window.innerWidth <= 768 && window.SidebarComponent) {
        window.SidebarComponent.closeSidebar();
      }
    },
    
    /**
     * Mostra il messaggio di benvenuto
     */
    showWelcomeMessage: function() {
      const messagesContainer = document.getElementById('messages-container');
      if (!messagesContainer) return;

      // Crea il messaggio di benvenuto
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
      
      // Aggiungi il messaggio al container
      messagesContainer.appendChild(welcomeDiv);
      
      // Aggiungi event listener ai chip di suggerimento
      if (window.SuggestionsComponent) {
        setTimeout(() => {
          window.SuggestionsComponent.setupWelcomeSuggestions(welcomeDiv);
        }, 100);
      }

      // Salva il messaggio di benvenuto nella chat
      const chats = window.StorageManager.getChats();
      const chat = chats[this.state.currentChatId] || {
        messages: [],
        timestamp: new Date().toISOString(),
        title: 'Nuova conversazione'
      };
      
      // Aggiungi il messaggio di benvenuto come messaggio del bot
      chat.messages.push({
        sender: 'bot',
        text: "Benvenuto al Concierge Digitale di Villa Petriolo. Sono qui per aiutarti con informazioni sul ristorante, attività disponibili, eventi e servizi. Come posso esserti utile oggi?"
      });
      
      // Salva la chat
      chats[this.state.currentChatId] = chat;
      window.StorageManager.saveChats(chats);
    },
    
    /**
     * Carica una chat esistente
     * @param {string} chatId - ID della chat da caricare
     */
    loadChat: function(chatId) {
      console.log('Loading chat:', chatId);
      
      const chats = window.StorageManager.getChats();
      const chat = chats[chatId];
      
      if (!chat) {
        console.error('Chat not found:', chatId);
        return;
      }
      
      // Set current chat
      this.state.currentChatId = chatId;
      
      const messagesContainer = document.getElementById('messages-container');
      if (!messagesContainer) return;
      
      // Clear and populate messages
      messagesContainer.innerHTML = '';
      chat.messages.forEach(msg => {
        window.MessageComponent.displayMessage(msg.text, msg.sender);
      });
      
      // Reset context
      if (window.conversationContext) {
        window.conversationContext.reset();
        
        // Reconstruct context from chat history
        const userMessages = chat.messages.filter(msg => msg.sender === 'user').map(msg => msg.text);
        userMessages.forEach(msg => {
          window.conversationContext.analyzeMessage(msg, chat.messages);
        });
        
        // Update topic indicator
        this.updateTopicIndicator(window.conversationContext.currentTopic);
      }
      
      // Update UI
      window.SidebarComponent.updateChatList(this.state.currentChatId);
    },
    
    /**
     * Elimina una chat
     * @param {string} chatId - ID della chat da eliminare
     */
    deleteChat: function(chatId) {
      console.log('Deleting chat:', chatId);
      
      const chats = window.StorageManager.getChats();
      delete chats[chatId];
      window.StorageManager.saveChats(chats);
      
      // If current chat is deleted, create a new one
      if (chatId === this.state.currentChatId) {
        this.createNewChat();
      } else {
        window.SidebarComponent.updateChatList(this.state.currentChatId);
      }
    },
    
    /**
     * Aggiunge un messaggio alla chat corrente
     * @param {string} text - Testo del messaggio
     * @param {string} sender - Mittente ('user' o 'bot')
     */
    addMessage: function(text, sender) {
      console.log('Adding message:', { sender, text: text.substring(0, 30) + '...' });
      
      // Display message
      window.MessageComponent.displayMessage(text, sender);
      
      // Save message
      const chats = window.StorageManager.getChats();
      
      if (!this.state.currentChatId) {
        this.state.currentChatId = 'chat_' + Date.now();
      }
      
      // Get or create chat
      const chat = chats[this.state.currentChatId] || {
        messages: [],
        timestamp: new Date().toISOString(),
        title: 'Nuova conversazione'
      };
      
      // Add message
      chat.messages.push({ sender, text });
      
      // Update chat info
      chat.timestamp = new Date().toISOString();
      
      // Set title from first user message
      if (sender === 'user' && chat.messages.filter(m => m.sender === 'user').length === 1) {
        chat.title = text.length > 20 ? text.substring(0, 17) + '...' : text;
      }
      
      // Save
      chats[this.state.currentChatId] = chat;
      window.StorageManager.saveChats(chats);
      
      // Update UI
      window.SidebarComponent.updateChatList(this.state.currentChatId);
      
      // Aggiorna il context se è un messaggio dell'utente
      if (sender === 'user' && window.conversationContext) {
        const context = window.conversationContext.analyzeMessage(text, chat.messages);
        this.updateTopicIndicator(context.topic);
      }
    },
    
    /**
     * Aggiorna l'indicatore di argomento
     * @param {string|null} topic - L'argomento corrente
     */
    updateTopicIndicator: function(topic) {
      const currentTopicIndicator = document.getElementById('current-topic');
      if (!currentTopicIndicator) return;
      
      // Rimuovi tutte le classi precedenti
      currentTopicIndicator.className = '';
      
      if (!topic) {
        currentTopicIndicator.textContent = '';
        return;
      }
      
      // Aggiungi la classe appropriata e il testo
      currentTopicIndicator.classList.add(topic);
      
      // Imposta il testo in base all'argomento
      switch (topic) {
        case 'menu':
          currentTopicIndicator.textContent = 'Ristorante';
          break;
        case 'attivita':
          currentTopicIndicator.textContent = 'Attività';
          break;
        case 'servizi':
          currentTopicIndicator.textContent = 'Servizi';
          break;
        case 'eventi':
          currentTopicIndicator.textContent = 'Eventi';
          break;
        default:
          currentTopicIndicator.textContent = '';
      }
    },
    
    /**
     * Gestisce l'invio di un messaggio
     * @param {string} userMessage - Messaggio dell'utente
     */
    async handleMessageSubmit(userMessage) {
      if (userMessage.trim() === '' || this.state.isWaitingForResponse) return;
      
      // Add user message
      this.addMessage(userMessage, 'user');
      
      // Disabilita l'input mentre il bot risponde
      const messageInput = document.getElementById('message-input');
      if (messageInput) {
        messageInput.value = '';
        messageInput.setAttribute('disabled', 'true');
        messageInput.setAttribute('placeholder', 'Il concierge sta rispondendo...');
      }
      
      // Show typing indicator
      this.state.isWaitingForResponse = true;
      window.MessageComponent.showTypingIndicator();
      
      // Aggiungiamo un ritardo variabile e realistico in base alla lunghezza del messaggio
      const baseDelay = 1000; // Ritardo base di 1 secondo
      const charDelay = 15; // 15ms per carattere aggiuntivo
      const randomFactor = Math.random() * 500; // Fattore casuale fino a 0,5 secondi
      
      // Calcola il ritardo totale
      const typingDelay = baseDelay + (userMessage.length * charDelay) + randomFactor;
      
      setTimeout(async () => {
        try {
          // Preparare il contesto utente se disponibile
          let userContext = {};
          if (window.conversationContext) {
            userContext = {
              userInterests: Array.from(window.conversationContext.userInterests),
              userPreferences: window.conversationContext.userPreferences
            };
          }
          
          // Ottieni la risposta migliorata dal contesto
          let enhancedMessage = userMessage;
          if (window.conversationContext) {
            const chats = window.StorageManager.getChats();
            const conversation = chats[this.state.currentChatId]?.messages || [];
            enhancedMessage = window.conversationContext.enhanceMessage(userMessage, conversation);
          }
          
          // Invia il messaggio al backend
          const botResponse = await window.ChatAPI.sendMessage(
            enhancedMessage, 
            this.state.currentChatId,
            userContext
          );
          
          // Rimuovi l'indicatore di digitazione
          window.MessageComponent.removeTypingIndicator();
          
          // Aggiungi la risposta del bot
          this.addMessage(botResponse, 'bot');
        } catch (error) {
          console.error('Error processing message:', error);
          
          // Rimuovi l'indicatore di digitazione
          window.MessageComponent.removeTypingIndicator();
          
          // Mostra un messaggio di errore
          this.addMessage("Mi scusi, si è verificato un errore. Potrebbe riprovare tra poco?", 'bot');
        } finally {
          // Riattiva l'input
          if (messageInput) {
            messageInput.removeAttribute('disabled');
            messageInput.setAttribute('placeholder', 'Scrivi un messaggio...');
            messageInput.focus();
          }
          
          this.state.isWaitingForResponse = false;
        }
      }, typingDelay);
    },

    /**
     * Configura il pulsante "Nuova chat"
     */
    setupNewChatButton: function() {
      const newChatBtn = document.getElementById('new-chat-btn');
      if (!newChatBtn) {
        console.error('New chat button not found');
        return;
      }
      
      // Rimuovi eventuali listener precedenti
      const newBtn = newChatBtn.cloneNode(true);
      if (newChatBtn.parentNode) {
        newChatBtn.parentNode.replaceChild(newBtn, newChatBtn);
      }
      
      // Aggiungi il nuovo listener
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('New chat button clicked directly in ChatCore');
        this.createNewChat();
      });
      
      console.log('New chat button configured in ChatCore');
    }
  };
  
  // Esporta il modulo
  window.ChatCore = ChatCore;