// frontend/js/components/modal.js
// Gestione delle finestre modali

const ModalComponent = {
  /**
   * Mostra una finestra modale con messaggio e callback di conferma
   * @param {string} message - Messaggio da mostrare
   * @param {Function} confirmCallback - Funzione da chiamare in caso di conferma
   */
  showModal: function(message, confirmCallback) {
    console.log('DEBUG: showModal called with message:', message);
    
    const modal = document.getElementById('custom-modal');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    
    console.log('DEBUG: Modal elements found:', {
      modal: !!modal,
      modalMessage: !!modalMessage,
      confirmBtn: !!confirmBtn,
      cancelBtn: !!cancelBtn
    });
    
    if (!modal || !modalMessage || !confirmBtn || !cancelBtn) {
      console.error('DEBUG: Some modal elements are missing');
      // Fallback: usa confirm normale
      if (confirm(message) && typeof confirmCallback === 'function') {
        console.log('DEBUG: Using native confirm as fallback, user confirmed');
        confirmCallback();
      }
      return;
    }
    
    // Imposta il messaggio
    modalMessage.textContent = message;
    console.log('DEBUG: Modal message set');
    
    // Mostra il modale
    modal.classList.add('show');
    console.log('DEBUG: Modal shown (added "show" class)');
    
    // Gestisci i pulsanti
    const handleConfirm = () => {
      console.log('DEBUG: Confirm button clicked');
      modal.classList.remove('show');
      console.log('DEBUG: Modal hidden (removed "show" class)');
      
      // Rimuovi listener prima di eseguire il callback
      newConfirmBtn.removeEventListener('click', handleConfirm);
      newCancelBtn.removeEventListener('click', handleCancel);
      console.log('DEBUG: Event listeners removed');
      
      if (typeof confirmCallback === 'function') {
        console.log('DEBUG: Executing confirm callback');
        confirmCallback();
      } else {
        console.log('DEBUG: No confirm callback provided or not a function');
      }
    };
    
    const handleCancel = () => {
      console.log('DEBUG: Cancel button clicked');
      modal.classList.remove('show');
      console.log('DEBUG: Modal hidden (removed "show" class)');
      
      // Rimuovi listener
      newConfirmBtn.removeEventListener('click', handleConfirm);
      newCancelBtn.removeEventListener('click', handleCancel);
      console.log('DEBUG: Event listeners removed');
    };
    
    // Rimuovi eventuali listener precedenti per evitare duplicati
    console.log('DEBUG: Cloning buttons to remove existing event listeners');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    
    if (confirmBtn.parentNode) {
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      console.log('DEBUG: Confirm button replaced with clone');
    } else {
      console.error('DEBUG: Confirm button has no parent node');
    }
    
    if (cancelBtn.parentNode) {
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      console.log('DEBUG: Cancel button replaced with clone');
    } else {
      console.error('DEBUG: Cancel button has no parent node');
    }
    
    // Aggiungi i nuovi listener
    console.log('DEBUG: Adding event listeners to new buttons');
    newConfirmBtn.addEventListener('click', handleConfirm);
    newCancelBtn.addEventListener('click', handleCancel);
    
    // Aggiungiamo anche un listener per clic diretto in caso di problemi con gli eventi
    newConfirmBtn.onclick = function(e) {
      console.log('DEBUG: Confirm button clicked via onclick');
      e.stopPropagation();
      e.preventDefault();
      handleConfirm();
      return false;
    };
    
    newCancelBtn.onclick = function(e) {
      console.log('DEBUG: Cancel button clicked via onclick');
      e.stopPropagation();
      e.preventDefault();
      handleCancel();
      return false;
    };
    
    console.log('DEBUG: Modal setup completed');
  }
};

// Esporta il modulo
window.ModalComponent = ModalComponent;

// Log di debug quando il modulo viene caricato
console.log('DEBUG: ModalComponent module loaded');