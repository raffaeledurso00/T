// frontend/js/components/message.js
// Gestione dei messaggi nella chat

const MessageComponent = {
  /**
   * Mostra un messaggio nella UI
   * @param {string} text - Testo del messaggio
   * @param {string} sender - Mittente ('user' o 'bot')
   */
  displayMessage: function(text, sender) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender === 'user' ? 'user-row' : 'bot-row'}`;
    
    // Formatta il messaggio solo se è del bot
    let formattedText = text;
    if (sender === 'bot') {
      // Prima verifica se il testo contiene già HTML
      const containsHtml = /<\/?[a-z][\s\S]*>/i.test(text);
      
      if (containsHtml) {
        // Se contiene già HTML, rispetta la formattazione esistente
        formattedText = text;
      } else if (window.messageFormatter) {
        // Altrimenti usa il formattatore
        formattedText = window.messageFormatter.format(text);
        
        // Se il formattatore non ha trovato contenuto formattabile,
        // prova a cercare pattern di liste e formattarle
        if (formattedText === text) {
          formattedText = this.formatListsInText(text);
        }
      }
    }
    
    messageRow.innerHTML = `
      <div class="message ${sender === 'user' ? 'user-message' : 'bot-message'}">
        <div class="message-avatar">
          <i class="${sender === 'user' ? 'fas fa-user' : 'fas fa-concierge-bell'}"></i>
        </div>
        <div class="message-content">
          ${formattedText}
        </div>
      </div>
    `;
    
    // Aggiunge suggerimenti rapidi solo se è un messaggio del bot
    if (sender === 'bot') {
      // Verifica se il messaggio contiene formattazione speciale
      const hasFormattedContent = messageRow.querySelector('.formatted-section') || 
                                 messageRow.querySelector('.formatted-list');
      
      // Verifica se il messaggio finisce con una domanda 
      const lastChar = text.trim().slice(-1);
      const endsWithQuestion = lastChar === '?';
      
      // Aggiungi i suggerimenti rapidi se non ha formattazione o se ha formattazione
      // ma contiene anche una conclusione con punto interrogativo
      if (endsWithQuestion || (hasFormattedContent && text.includes('?'))) {
        window.SuggestionsComponent.addQuickSuggestionsToMessage(messageRow, text);
      }
    }
    
    messagesContainer.appendChild(messageRow);
    
    // Imposta la variabile --item-index per ogni elemento della lista per l'animazione
    const listItems = messageRow.querySelectorAll('.list-item');
    listItems.forEach((item, index) => {
      item.style.setProperty('--item-index', index);
    });
    
    // Scorri alla fine del contenitore dei messaggi
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },
  
  /**
   * Formatta le liste nel testo se ce ne sono
   * @param {string} text - Testo in cui cercare liste
   * @returns {string} Testo con liste formattate in HTML
   */
  formatListsInText: function(text) {
    // Cerca pattern di liste (linee che iniziano con - o • o numeri seguiti da punto)
    const bulletListPattern = /(?:^|\n)(?:\s*[-•*]\s+.+(?:\n|$))+/gm;
    const numberedListPattern = /(?:^|\n)(?:\s*\d+\.\s+.+(?:\n|$))+/gm;
    
    let formattedText = text;
    let hasLists = false;
    
    // Gestisci liste con bullet points
    let match;
    const bulletMatches = formattedText.match(bulletListPattern);
    
    if (bulletMatches) {
      hasLists = true;
      
      bulletMatches.forEach(listText => {
        const items = listText.split('\n')
          .filter(line => /^\s*[-•*]\s+/.test(line))
          .map(line => line.replace(/^\s*[-•*]\s+/, '').trim());
        
        if (items.length > 0) {
          const htmlList = `<ul class="formatted-list">
            ${items.map(item => `<li class="list-item">${item}</li>`).join('')}
          </ul>`;
          
          formattedText = formattedText.replace(listText, htmlList);
        }
      });
    }
    
    // Gestisci liste numerate
    const numberedMatches = formattedText.match(numberedListPattern);
    
    if (numberedMatches) {
      hasLists = true;
      
      numberedMatches.forEach(listText => {
        const items = listText.split('\n')
          .filter(line => /^\s*\d+\.\s+/.test(line))
          .map(line => line.replace(/^\s*\d+\.\s+/, '').trim());
        
        if (items.length > 0) {
          const htmlList = `<ol class="formatted-list">
            ${items.map(item => `<li class="list-item">${item}</li>`).join('')}
          </ol>`;
          
          formattedText = formattedText.replace(listText, htmlList);
        }
      });
    }
    
    // Se abbiamo trovato e formattato delle liste, avvolgi tutto in una sezione formattata
    if (hasLists) {
      formattedText = `<div class="formatted-section">${formattedText}</div>`;
    }
    
    return formattedText;
  },
  
  /**
   * Mostra l'indicatore di digitazione
   */
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
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(indicatorRow);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },
  
  /**
   * Rimuove l'indicatore di digitazione
   */
  removeTypingIndicator: function() {
    const indicator = document.getElementById('typing-indicator-row');
    if (indicator) indicator.remove();
  }
};

// Esporta il modulo
window.MessageComponent = MessageComponent;