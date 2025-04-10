// frontend/js/components/message.js
// Gestione dei messaggi nella chat

const MessageComponent = {
  /**
   * Verifica se un messaggio è un saluto
   * @param {string} text - Testo da verificare
   * @returns {boolean} - true se è un saluto
   */
  isGreeting: function(text) {
    if (!text) return false;
    
    // Lista di pattern per i saluti comuni
    const greetingPatterns = [
      /^(ciao|salve|buongiorno|buonasera|hey|hi|hello|benvenuto)/i,
      /^(salve|sono)\s+(il|la|l')\s+concierge/i,
      /come\s+posso\s+aiutarti|come\s+posso\s+esserti\s+utile/i,
      /sono\s+(qui|disponibile)\s+per\s+aiutarti/i
    ];
    
    return greetingPatterns.some(pattern => pattern.test(text));
  },
  
  /**
   * Formatta un messaggio di saluto
   * @param {string} text - Testo del saluto
   * @returns {string} - HTML formattato per il saluto
   */
  formatGreeting: function(text) {
    return `<div class="welcome-message-small">
      <p>${text}</p>
      <div class="quick-suggestions">
        <button class="suggestion-chip" data-message="Quali sono gli orari del ristorante?">
          <i class="fas fa-utensils"></i> Ristorante
        </button>
        <button class="suggestion-chip" data-message="Che attività posso fare oggi?">
          <i class="fas fa-hiking"></i> Attività
        </button>
        <button class="suggestion-chip" data-message="Quali eventi sono in programma?">
          <i class="fas fa-calendar-alt"></i> Eventi
        </button>
      </div>
    </div>`;
  },
  /**
   * Formatta in modo speciale gli orari del ristorante
   * @param {string} text - Testo con informazioni sugli orari
   * @returns {string} - HTML formattato per gli orari
   */
  formatRestaurantHours: function(text) {
    // Cerca di estrarre le parti significative
    let openingDays = 'tutti i giorni';
    let lunchTime = '12:30 - 14:30';
    let dinnerTime = '19:30 - 22:30';
    let bookingInfo = 'prenotazioni al numero interno 122 o via email a ristorante@villapetriolo.com';
    
    // Pattern per l'esempio dello screenshot
    if (text.includes('Il nostro ristorante è aperto tutti i giorni')) {
      // Estrazione migliore per lo specifico formato
      const pattern = /Il nostro ristorante \u00e8 aperto (.*?) con i seguenti orari[\s\S]*?Pranzo: ([^\n\r]+)[\s\S]*?Cena: ([^\n\r\}]+)/i;
      const match = text.match(pattern);
      
      if (match) {
        openingDays = match[1].trim();
        lunchTime = match[2].trim();
        dinnerTime = match[3].trim();
      }
      
      // Cerca informazioni sulle prenotazioni
      const bookPattern = /prenotazioni[^\}]*/i;
      const bookMatch = text.match(bookPattern);
      if (bookMatch) {
        bookingInfo = bookMatch[0].trim();
      }
    } else {
      // Pattern generici per altri formati
      const openingMatch = text.match(/aperto ([^\n]+)/i);
      const lunchMatch = text.match(/pranzo:?\s*([^\n]+)/i);
      const dinnerMatch = text.match(/cena:?\s*([^\n]+)/i);
      const bookingMatch = text.match(/prenota[^\.,]+([^\.,]+)/i);
      
      if (openingMatch) openingDays = openingMatch[1].trim();
      if (lunchMatch) lunchTime = lunchMatch[1].trim();
      if (dinnerMatch) dinnerTime = dinnerMatch[1].trim();
      if (bookingMatch) bookingInfo = bookingMatch[0].trim();
    }
    
    // Ritorna la versione formattata HTML
    return `
      <div class="formatted-section menu-section">
        <div class="section-title">ORARI RISTORANTE:</div>
        <ul class="formatted-list menu-list">
          <li class="list-item menu-item">
            <div class="item-header">
              <div class="item-name">Giorni di apertura</div>
              <div class="item-price">${openingDays}</div>
            </div>
          </li>
          <li class="list-item menu-item">
            <div class="item-header">
              <div class="item-name">Pranzo</div>
              <div class="item-price">${lunchTime}</div>
            </div>
          </li>
          <li class="list-item menu-item">
            <div class="item-header">
              <div class="item-name">Cena</div>
              <div class="item-price">${dinnerTime}</div>
            </div>
          </li>
        </ul>
        <p class="conclusion-text">${bookingInfo}</p>
      </div>
    `;
  },
  /**
   * Pulisce il testo da eventuali metadati o formati JSON residui
   * @param {string} text - Testo da pulire
   * @returns {string} - Testo pulito
   */
  cleanMessageText: function(text) {
    if (typeof text !== 'string') {
      return text;
    }
    
    let cleanedText = text;
    
    // Rimuovi eventuali caratteri JSON inutili
    cleanedText = cleanedText.replace(/^\"|\"$/g, '');

    // Cerca pattern come {"message":"...","sessionId":"...","source":"...","language":"..."}  
    const jsonPattern = /\{"?message"?:"(.*?)","?sessionId"?:/is;
    const match = cleanedText.match(jsonPattern);
    if (match && match[1]) {
      cleanedText = match[1];
      // Rimuovi le sequenze di escape residue
      cleanedText = cleanedText.replace(/\\\\/g, '\\');
    }
    
    // Pattern specifici da cercare (basati sullo screenshot)
    const keyValuePattern = /\{.*?"message":"(.*?)".*?\}/is;
    const keyValueMatch = cleanedText.match(keyValuePattern);
    if (keyValueMatch && keyValueMatch[1]) {
      cleanedText = keyValueMatch[1];
    }
    
    // Controlla nello specifico per il formato visto nello screenshot con \n
    cleanedText = cleanedText.replace(/\\n/g, '\n');
    cleanedText = cleanedText.replace(/\\r/g, '\r');
    cleanedText = cleanedText.replace(/\\t/g, '\t');
    
    return cleanedText;
  },

  /**
   * Mostra un messaggio nella UI
   * @param {string} text - Testo del messaggio
   * @param {string} sender - Mittente ('user' o 'bot')
   */
  displayMessage: function(text, sender) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    // Assicuriamo che il testo sia una stringa
    let messageText = text;
    if (typeof text !== 'string') {
      console.warn('MessageComponent: text is not a string:', text);
      if (text === null || text === undefined) {
        messageText = "";
      } else if (typeof text === 'object') {
        messageText = text.message || JSON.stringify(text);
      } else {
        messageText = String(text);
      }
    }
    
    // Pulisci il testo da eventuali metadati o formati JSON residui
    messageText = this.cleanMessageText(messageText);
    
    // Controlla se il testo sembra essere un JSON e cerca di estrarre solo il messaggio
    if (typeof messageText === 'string' && 
        (messageText.startsWith('{') && messageText.endsWith('}')) || 
        messageText.includes('"message":')) {
      try {
        // Controlla se è un oggetto JSON valido
        const jsonObj = JSON.parse(messageText);
        if (jsonObj && typeof jsonObj === 'object') {
          // Estrai il messaggio se disponibile
          if (typeof jsonObj.message === 'string') {
            messageText = jsonObj.message;
          }
        }
      } catch (e) {
        // Non è un JSON valido, mantieni il testo originale
        console.log('Non è un JSON valido, ignoro:', e);
      }
    }
    
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${sender === 'user' ? 'user-row' : 'bot-row'}`;
    
    // Formatta il messaggio solo se è del bot
    let formattedText = messageText;
    if (sender === 'bot') {
      // Cerca pattern specifici per orari del ristorante
      if (messageText.includes('ORARI') && messageText.includes('ristorante') && messageText.includes('Pranzo')) {
        // Pattern di orario del ristorante, formatta in modo speciale
        formattedText = this.formatRestaurantHours(messageText);
      } else if (messageText.includes('Il nostro ristorante') && messageText.includes('orari') && messageText.includes('Pranzo')) {
        // Pattern alternativo per gli orari del ristorante
        formattedText = this.formatRestaurantHours(messageText);
      } 
      // Gestione speciale per i saluti
      else if (this.isGreeting(messageText)) {
        formattedText = this.formatGreeting(messageText);
      } else {
        // Prima verifica se il testo contiene già HTML
        const containsHtml = /<\/?[a-z][\s\S]*>/i.test(messageText);
        
        if (containsHtml) {
          // Se contiene già HTML, rispetta la formattazione esistente
          formattedText = messageText;
        } else if (window.messageFormatter) {
          // Altrimenti usa il formattatore
          formattedText = window.messageFormatter.format(messageText);
          
          // Se il formattatore non ha trovato contenuto formattabile,
          // prova a cercare pattern di liste e formattarle
          if (formattedText === messageText) {
            formattedText = this.formatListsInText(messageText);
          }
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
    
    // Aggiungi event listeners ai suggestion chip dentro il messaggio di saluto
    if (this.isGreeting(messageText)) {
      const chips = messageRow.querySelectorAll('.suggestion-chip');
      chips.forEach(chip => {
        // Rimuovi eventuali listener esistenti
        const newChip = chip.cloneNode(true);
        chip.parentNode.replaceChild(newChip, chip);
        
        // Aggiungi il nuovo listener
        newChip.addEventListener('click', (e) => {
          const message = newChip.getAttribute('data-message');
          if (message && window.ChatCore) {
            window.ChatCore.handleMessageSubmit(message);
          }
        });
      });
    }
    
    // Aggiunge suggerimenti rapidi solo se è un messaggio del bot
    if (sender === 'bot') {
      // Verifica se il messaggio contiene formattazione speciale
      const hasFormattedContent = messageRow.querySelector('.formatted-section') || 
                                 messageRow.querySelector('.formatted-list');
      
      // Verifica se il messaggio finisce con una domanda 
      const lastChar = messageText.trim().slice(-1);
      const endsWithQuestion = lastChar === '?';
      
      // Aggiungi i suggerimenti rapidi se non ha formattazione o se ha formattazione
      // ma contiene anche una conclusione con punto interrogativo
      if (endsWithQuestion || (hasFormattedContent && messageText.includes('?'))) {
        window.SuggestionsComponent.addQuickSuggestionsToMessage(messageRow, messageText);
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