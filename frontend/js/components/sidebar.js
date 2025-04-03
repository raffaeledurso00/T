// frontend/js/components/sidebar.js
// Gestione della sidebar laterale

const SidebarComponent = {
  /**
   * Aggiorna la lista delle chat nella sidebar
   * @param {string} currentChatId - ID della chat attualmente attiva
   */
  updateChatList: function(currentChatId) {
    console.log('DEBUG: Updating chat list, current chat ID:', currentChatId);
    
    const sidebarChats = document.getElementById('sidebar-chats');
    if (!sidebarChats) {
      console.error('DEBUG: Sidebar chats container not found');
      return;
    }
    
    const chats = window.StorageManager.getChats();
    console.log('DEBUG: Retrieved chats from storage:', Object.keys(chats).length);
    
    const chatIds = Object.keys(chats).sort((a, b) => {
      return new Date(chats[b].timestamp) - new Date(chats[a].timestamp);
    });
    
    // Clear sidebar
    sidebarChats.innerHTML = '';
    
    if (chatIds.length === 0) {
      console.log('DEBUG: No chats available');
      sidebarChats.innerHTML = '<div class="empty-chats">Nessuna chat disponibile</div>';
      return;
    }
    
    // Add each chat to sidebar
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
      console.log(`DEBUG: Added chat to sidebar: ${chatId}`);
    });
    
    // Add click events
    this.setupChatItemListeners();
    this.setupDeleteButtons();
    this.setupDropdownMenus();
    
    console.log('DEBUG: Chat list update completed');
  },
  
  /**
   * Configura i listener per i menu dropdown e logout
   */
  setupDropdownMenus: function() {
    console.log('DEBUG: Setting up dropdown menus');
    
    // Elimina eventuali event listener precedenti clonando e sostituendo gli elementi
    this.removeOldEventListenersFromDropdowns();
    
    // User dropdown toggle
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userDropdownToggle && userDropdown) {
      userDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
        
        // Chiudi l'altro dropdown se aperto
        const settingsDropdown = document.getElementById('settings-dropdown');
        if (settingsDropdown && settingsDropdown.classList.contains('active')) {
          settingsDropdown.classList.remove('active');
        }
      });
      console.log('DEBUG: User dropdown toggle event listener added');
    } else {
      console.error('DEBUG: User dropdown toggle or dropdown not found');
    }
    
    // Settings dropdown toggle
    const settingsMenuToggle = document.getElementById('settings-menu-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    
    if (settingsMenuToggle && settingsDropdown) {
      settingsMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
        
        // Chiudi l'altro dropdown se aperto
        if (userDropdown && userDropdown.classList.contains('active')) {
          userDropdown.classList.remove('active');
        }
      });
      console.log('DEBUG: Settings dropdown toggle event listener added');
    } else {
      console.error('DEBUG: Settings dropdown toggle or dropdown not found');
    }
    
    // Configura i pulsanti nei menu
    this.setupDropdownButtons();
    
    console.log('DEBUG: Dropdown menus setup completed');
  },
  
  /**
   * Rimuove gli event listener esistenti dagli elementi dropdown
   */
  removeOldEventListenersFromDropdowns: function() {
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const settingsMenuToggle = document.getElementById('settings-menu-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAllChatsBtn = document.getElementById('delete-all-chats-btn');
    const settingsBtn = document.getElementById('settings-btn');
    
    // Clona e sostituisci gli elementi per rimuovere i listener
    if (userDropdownToggle && userDropdownToggle.parentNode) {
      const newToggle = userDropdownToggle.cloneNode(true);
      userDropdownToggle.parentNode.replaceChild(newToggle, userDropdownToggle);
    }
    
    if (settingsMenuToggle && settingsMenuToggle.parentNode) {
      const newToggle = settingsMenuToggle.cloneNode(true);
      settingsMenuToggle.parentNode.replaceChild(newToggle, settingsMenuToggle);
    }
    
    if (logoutBtn && logoutBtn.parentNode) {
      const newBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    }
    
    if (deleteAllChatsBtn && deleteAllChatsBtn.parentNode) {
      const newBtn = deleteAllChatsBtn.cloneNode(true);
      deleteAllChatsBtn.parentNode.replaceChild(newBtn, deleteAllChatsBtn);
    }
    
    if (settingsBtn && settingsBtn.parentNode) {
      const newBtn = settingsBtn.cloneNode(true);
      settingsBtn.parentNode.replaceChild(newBtn, settingsBtn);
    }
  },
  
  /**
   * Configura i pulsanti nei dropdown
   */
  setupDropdownButtons: function() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        console.log('DEBUG: Logout button clicked');
        if (typeof window.AuthManager?.logout === 'function') {
          window.AuthManager.logout();
        } else {
          console.error('DEBUG: AuthManager.logout function not available');
          // Fallback: clear local storage and reload
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.reload();
        }
      });
      console.log('DEBUG: Logout button event listener added');
    } else {
      console.error('DEBUG: Logout button not found');
    }
    
    // Delete all chats button
    const deleteAllChatsBtn = document.getElementById('delete-all-chats-btn');
    if (deleteAllChatsBtn) {
      deleteAllChatsBtn.addEventListener('click', () => {
        console.log('DEBUG: Delete all chats button clicked');
        
        // Usa il modale di conferma
        if (window.ModalComponent) {
          window.ModalComponent.showModal(
            'Sei sicuro di voler eliminare tutte le chat? Questa azione non può essere annullata.',
            () => {
              this.deleteAllChats();
            }
          );
        } else {
          if (confirm('Sei sicuro di voler eliminare tutte le chat? Questa azione non può essere annullata.')) {
            this.deleteAllChats();
          }
        }
      });
      console.log('DEBUG: Delete all chats button event listener added');
    } else {
      console.error('DEBUG: Delete all chats button not found');
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        console.log('DEBUG: Settings button clicked');
        alert('Impostazioni non ancora implementate. Funzionalità in arrivo!');
      });
      console.log('DEBUG: Settings button event listener added');
    } else {
      console.error('DEBUG: Settings button not found');
    }
    
    // Aggiungi listener al document per chiudere i dropdown quando si clicca altrove
    document.addEventListener('click', this.closeDropdownsOnClickOutside.bind(this));
  },
  
  /**
   * Chiude i dropdown quando si clicca altrove
   */
  closeDropdownsOnClickOutside: function(e) {
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const settingsMenuToggle = document.getElementById('settings-menu-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    
    if (userDropdown && userDropdown.classList.contains('active') && 
        userDropdownToggle && !userDropdownToggle.contains(e.target) && 
        !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('active');
    }
    
    if (settingsDropdown && settingsDropdown.classList.contains('active') && 
        settingsMenuToggle && !settingsMenuToggle.contains(e.target) && 
        !settingsDropdown.contains(e.target)) {
      settingsDropdown.classList.remove('active');
    }
  },
  
  /**
   * Elimina tutte le chat
   */
  deleteAllChats: function() {
    console.log('DEBUG: Deleting all chats');
    
    try {
      // Ottieni tutte le chat
      const chats = window.StorageManager.getChats();
      
      if (Object.keys(chats).length === 0) {
        console.log('DEBUG: No chats to delete');
        alert('Non ci sono chat da eliminare.');
        return;
      }
      
      // Elimina tutte le chat
      window.StorageManager.saveChats({});
      
      // Crea una nuova chat
      if (typeof window.ChatCore?.createNewChat === 'function') {
        window.ChatCore.createNewChat();
      } else {
        // Ricarica la pagina come fallback
        window.location.reload();
      }
      
      // Chiudi il dropdown
      const settingsDropdown = document.getElementById('settings-dropdown');
      if (settingsDropdown) {
        settingsDropdown.classList.remove('active');
      }
      
      console.log('DEBUG: All chats deleted successfully');
    } catch (error) {
      console.error('DEBUG: Error deleting all chats:', error);
      alert('Si è verificato un errore durante l\'eliminazione delle chat. Ricarica la pagina e riprova.');
    }
  },
  
  /**
   * Configura i listener per gli elementi della chat
   */
  setupChatItemListeners: function() {
    const chatItemContents = document.querySelectorAll('.chat-item-content');
    console.log(`DEBUG: Setting up listeners for ${chatItemContents.length} chat items`);
    
    chatItemContents.forEach(el => {
      el.addEventListener('click', (e) => {
        const chatId = el.getAttribute('data-id');
        console.log('DEBUG: Chat item clicked, ID:', chatId);
        if (typeof window.ChatCore.loadChat === 'function') {
          window.ChatCore.loadChat(chatId);
          
          // Chiudi la sidebar su mobile
          if (window.innerWidth <= 768) {
            document.body.classList.remove('sidebar-open');
          }
        } else {
          console.error('DEBUG: ChatCore.loadChat function not available');
        }
      });
    });
  },
  
  /**
   * Configura i pulsanti di eliminazione - VERSIONE CON DEBUG ESTESO
   */
  setupDeleteButtons: function() {
    const deleteBtns = document.querySelectorAll('.delete-chat-btn');
    console.log(`DEBUG: Setting up ${deleteBtns.length} delete buttons`);
    
    deleteBtns.forEach((btn, index) => {
      console.log(`DEBUG: Setting up delete button ${index+1}/${deleteBtns.length}`);
      
      // Rimuoviamo qualsiasi event listener esistente clonando il pulsante
      const originalBtn = btn;
      const newBtn = originalBtn.cloneNode(true);
      const chatId = originalBtn.getAttribute('data-id');
      
      console.log(`DEBUG: Original button data-id=${chatId}, replacing with clone`);
      
      if (originalBtn.parentNode) {
        originalBtn.parentNode.replaceChild(newBtn, originalBtn);
        console.log(`DEBUG: Button replaced successfully`);
      } else {
        console.error(`DEBUG: Button has no parent node, cannot replace`);
      }
      
      // Aggiungiamo il nuovo listener con un approccio diverso e più verbose
      newBtn.onclick = (e) => {
        console.log(`DEBUG: Delete button clicked for chat ID: ${chatId}`);
        e.stopPropagation();
        e.preventDefault();
        
        // Prima controlliamo se il modale è disponibile
        const modal = document.getElementById('custom-modal');
        const modalExists = !!modal;
        console.log(`DEBUG: Modal exists: ${modalExists}`);
        
        // Controlliamo se il componente ModalComponent è disponibile
        const modalComponentExists = !!window.ModalComponent;
        console.log(`DEBUG: ModalComponent exists: ${modalComponentExists}`);
        
        if (modalComponentExists && modalExists) {
          console.log(`DEBUG: Using modal component`);
          window.ModalComponent.showModal(
            'Sei sicuro di voler eliminare questa chat?',
            () => {
              console.log(`DEBUG: Modal confirmed, deleting chat ${chatId}`);
              this.performDeleteChat(chatId);
            }
          );
        } else {
          console.log(`DEBUG: Using built-in confirm as fallback`);
          if (confirm('Sei sicuro di voler eliminare questa chat?')) {
            console.log(`DEBUG: Confirm dialog confirmed, deleting chat ${chatId}`);
            this.performDeleteChat(chatId);
          } else {
            console.log(`DEBUG: Deletion cancelled by user`);
          }
        }
        
        return false; // Previene ulteriore propagazione e comportamento predefinito
      };
      
      console.log(`DEBUG: Delete button setup complete for chatId=${chatId}`);
    });
    
    console.log(`DEBUG: All delete buttons setup completed`);
  },
  
  /**
   * Esegue l'eliminazione della chat
   */
  performDeleteChat: function(chatId) {
    console.log(`DEBUG: Performing delete for chat ID: ${chatId}`);
    
    try {
      if (typeof window.ChatCore?.deleteChat === 'function') {
        console.log(`DEBUG: Using ChatCore.deleteChat`);
        window.ChatCore.deleteChat(chatId);
      } else {
        console.log(`DEBUG: ChatCore.deleteChat not available, using fallback`);
        
        // Implementazione diretta come fallback
        const chats = window.StorageManager.getChats();
        console.log(`DEBUG: Retrieved ${Object.keys(chats).length} chats from storage`);
        
        if (chats[chatId]) {
          console.log(`DEBUG: Found chat ${chatId} in storage, deleting it`);
          delete chats[chatId];
          window.StorageManager.saveChats(chats);
          console.log(`DEBUG: Chat deleted and storage updated`);
          
          // Aggiorna la UI
          this.updateChatList(window.ChatCore?.state?.currentChatId);
          
          // Se necessario, crea una nuova chat
          if (Object.keys(chats).length === 0) {
            console.log(`DEBUG: No chats remaining, creating new chat`);
            if (typeof window.ChatCore?.createNewChat === 'function') {
              window.ChatCore.createNewChat();
            } else {
              console.error(`DEBUG: Cannot create new chat, ChatCore.createNewChat not available`);
              // Ricarica la pagina come ultima risorsa
              console.log(`DEBUG: Reloading page as last resort`);
              window.location.reload();
            }
          }
        } else {
          console.error(`DEBUG: Chat ${chatId} not found in storage`);
        }
      }
    } catch (error) {
      console.error('DEBUG: Error in performDeleteChat:', error);
      alert('Si è verificato un errore durante l\'eliminazione della chat. Ricarica la pagina e riprova.');
    }
  },
  
  /**
   * Apre la sidebar (per mobile)
   */
  openSidebar: function() {
    if (window.innerWidth <= 768) {
      document.body.classList.add('sidebar-open');
      console.log('DEBUG: Sidebar opened');
    }
  },
  
  /**
   * Chiude la sidebar (per mobile)
   */
  closeSidebar: function() {
    if (window.innerWidth <= 768) {
      document.body.classList.remove('sidebar-open');
      console.log('DEBUG: Sidebar closed');
    }
  },
  
  /**
   * Imposta gli eventi per la UI mobile
   */
  setupMobileUI: function() {
    console.log('DEBUG: Setting up mobile UI');
    
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    // Gestione del pulsante toggle
    if (sidebarToggle) {
      // Rimuovi event listener esistenti
      const newToggle = sidebarToggle.cloneNode(true);
      if (sidebarToggle.parentNode) {
        sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
      }
      
      newToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('DEBUG: Sidebar toggle clicked');
        // Toggle della sidebar
        if (document.body.classList.contains('sidebar-open')) {
          this.closeSidebar();
        } else {
          this.openSidebar();
        }
      });
    } else {
      console.error('DEBUG: Sidebar toggle button not found');
    }
    
    // Utilizziamo SOLO l'overlay per la chiusura della sidebar
    if (sidebarOverlay) {
      // Rimuovi event listener esistenti
      const newOverlay = sidebarOverlay.cloneNode(true);
      if (sidebarOverlay.parentNode) {
        sidebarOverlay.parentNode.replaceChild(newOverlay, sidebarOverlay);
      }
      
      newOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('DEBUG: Sidebar overlay clicked');
        this.closeSidebar();
      });
      
      // Assicurati che sia cliccabile
      newOverlay.style.pointerEvents = 'auto';
    } else {
      console.error('DEBUG: Sidebar overlay not found');
    }
    
    console.log('DEBUG: Mobile UI setup completed');
  }
};

// Esporta il modulo
window.SidebarComponent = SidebarComponent;

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('DEBUG: DOMContentLoaded event fired in sidebar.js');
  // Assicurati che la sidebar mobile sia configurata
  if (typeof window.SidebarComponent.setupMobileUI === 'function') {
    window.SidebarComponent.setupMobileUI();
  }
});

// Reinizializza anche al caricamento completo della pagina
window.addEventListener('load', function() {
  console.log('DEBUG: Window load event fired in sidebar.js');
  // Assicurati che la sidebar mobile sia configurata
  if (typeof window.SidebarComponent.setupMobileUI === 'function') {
    window.SidebarComponent.setupMobileUI();
  }
  
  // Inizializza i dropdown menu
  if (typeof window.SidebarComponent.setupDropdownMenus === 'function') {
    window.SidebarComponent.setupDropdownMenus();
  }
});