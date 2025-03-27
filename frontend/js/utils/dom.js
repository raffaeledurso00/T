// frontend/js/utils/dom.js
// Utility per la manipolazione del DOM

const DOMUtils = {
    /**
     * Crea un elemento DOM con le proprietà e gli attributi specificati
     * @param {string} tag - Tag HTML dell'elemento
     * @param {Object} props - Proprietà e attributi dell'elemento
     * @param {string|Array|Node} children - Figli dell'elemento (testo o altri elementi)
     * @returns {HTMLElement} Elemento creato
     */
    createElement(tag, props = {}, children = null) {
        const element = document.createElement(tag);
        
        // Imposta le proprietà e gli attributi
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.entries(value).forEach(([prop, val]) => {
                    element.style[prop] = val;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                // Eventi (onClick, onInput, etc.)
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else if (key === 'data' && typeof value === 'object') {
                // Attributi data-*
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                // Altri attributi
                element.setAttribute(key, value);
            }
        });
        
        // Aggiungi i figli
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child) {
                        element.append(typeof child === 'string' ? document.createTextNode(child) : child);
                    }
                });
            } else {
                element.append(typeof children === 'string' ? document.createTextNode(children) : children);
            }
        }
        
        return element;
    },
    
    /**
     * Trova un elemento nel DOM
     * @param {string} selector - Selettore CSS
     * @param {HTMLElement} parent - Elemento genitore (default: document)
     * @returns {HTMLElement|null} Elemento trovato o null
     */
    find(selector, parent = document) {
        return parent.querySelector(selector);
    },
    
    /**
     * Trova tutti gli elementi nel DOM che corrispondono al selettore
     * @param {string} selector - Selettore CSS
     * @param {HTMLElement} parent - Elemento genitore (default: document)
     * @returns {NodeList} Lista di elementi trovati
     */
    findAll(selector, parent = document) {
        return parent.querySelectorAll(selector);
    },
    
    /**
     * Imposta o ottiene il testo di un elemento
     * @param {HTMLElement} element - Elemento DOM
     * @param {string|null} text - Testo da impostare (null per ottenere il testo)
     * @returns {string|undefined} Testo dell'elemento (se text è null)
     */
    text(element, text = null) {
        if (text === null) {
            return element.textContent;
        }
        element.textContent = text;
    },
    
    /**
     * Imposta o ottiene l'HTML di un elemento
     * @param {HTMLElement} element - Elemento DOM
     * @param {string|null} html - HTML da impostare (null per ottenere l'HTML)
     * @returns {string|undefined} HTML dell'elemento (se html è null)
     */
    html(element, html = null) {
        if (html === null) {
            return element.innerHTML;
        }
        element.innerHTML = html;
    },
    
    /**
     * Aggiunge o rimuove una classe da un elemento
     * @param {HTMLElement} element - Elemento DOM
     * @param {string} className - Nome della classe
     * @param {boolean} add - true per aggiungere, false per rimuovere
     */
    toggleClass(element, className, add) {
        if (add === undefined) {
            element.classList.toggle(className);
        } else if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    },
    
    /**
     * Svuota un elemento rimuovendo tutti i suoi figli
     * @param {HTMLElement} element - Elemento da svuotare
     */
    empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    
    /**
     * Imposta o ottiene il valore di un elemento input
     * @param {HTMLElement} element - Elemento input
     * @param {string|null} value - Valore da impostare (null per ottenere il valore)
     * @returns {string|undefined} Valore dell'elemento (se value è null)
     */
    val(element, value = null) {
        if (value === null) {
            return element.value;
        }
        element.value = value;
    },
    
    /**
     * Abilita o disabilita un elemento input
     * @param {HTMLElement} element - Elemento input
     * @param {boolean} disabled - true per disabilitare, false per abilitare
     */
    disable(element, disabled = true) {
        if (disabled) {
            element.setAttribute('disabled', 'disabled');
        } else {
            element.removeAttribute('disabled');
        }
    },
    
    /**
     * Scorre un contenitore alla fine
     * @param {HTMLElement} container - Contenitore da scorrere
     */
    scrollToBottom(container) {
        container.scrollTop = container.scrollHeight;
    },
    
    /**
     * Controlla se un elemento è visibile nell'area visibile
     * @param {HTMLElement} element - Elemento da controllare
     * @returns {boolean} true se l'elemento è visibile
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }
};

// Esporta l'oggetto DOMUtils
window.DOMUtils = DOMUtils;