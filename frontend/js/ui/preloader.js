// frontend/js/ui/preloader.js
// Gestione dell'animazione di caricamento iniziale

const PreloaderManager = {
  /**
   * Inizializza e avvia il preloader
   */
  init: function() {
      console.log('Preloader initialization');
      
      // Verifica se GSAP è stato caricato correttamente
      if (typeof gsap === 'undefined') {
          console.error('GSAP non è stato caricato. Il preloader non funzionerà correttamente.');
          this.hidePreloader();
          return;
      }
      
      // Riferimenti elementi DOM
      this.preloader = document.getElementById('js-preloader');
      this.loadingCircle = document.getElementById('loading-circle');
      this.preloaderLogo = document.getElementById('preloader-logo');
      this.chatContainer = document.querySelector('.chat-container');
      
      // Verifica che tutti gli elementi necessari esistano
      if (!this.preloader || !this.loadingCircle || !this.preloaderLogo || !this.chatContainer) {
          console.error('Elementi DOM mancanti. Il preloader non funzionerà correttamente.');
          this.hidePreloader();
          return;
      }
      
      // Nascondi la chat container durante il preloader
      this.chatContainer.style.opacity = '0';
      
      // Inizia l'animazione del preloader
      this.startAnimation();
      
      // Gestione degli errori: se qualcosa va storto, nascondi il preloader dopo 5 secondi
      this.setupTimeoutSafety();
  },
  
  /**
   * Avvia l'animazione del preloader
   */
  startAnimation: function() {
      const timeline = gsap.timeline();
      
      // Animazione del cerchio di caricamento
      timeline.fromTo(this.loadingCircle, 
          { strokeDashoffset: 565.48 }, 
          { 
              strokeDashoffset: 0, 
              duration: 2.5, 
              ease: "power2.inOut",
              onComplete: () => this.completePreloader()
          }
      );
      
      // Aggiunge un'animazione di pulsazione al logo
      gsap.to(this.preloaderLogo, {
          scale: 1.05,
          duration: 1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
      });
  },
  
  /**
   * Completa l'animazione del preloader e mostra l'app
   */
  completePreloader: function() {
    console.log('Completing preloader animation');
    
    // Interrompi l'animazione di pulsazione del logo
    gsap.killTweensOf(this.preloaderLogo);
    
    // Anima la dissolvenza di tutto il preloader
    gsap.to(this.preloader, {
        autoAlpha: 0,
        duration: 0.8,
        onComplete: () => {
            // Nascondi completamente il preloader
            this.preloader.style.display = 'none';
            
            // Mostra l'interfaccia della chat con un'animazione di dissolvenza
            gsap.to(this.chatContainer, {
                opacity: 1,
                duration: 0.6,
                onComplete: () => {
                    // Aggiungi classe per indicare che l'app è caricata
                    document.body.classList.add('app-loaded');
                    
                    // Trigger appReady event
                    const event = new Event('appReady');
                    document.dispatchEvent(event);
                }
            });
        }
    });
},
  
  /**
   * Configura un timeout di sicurezza per il preloader
   */
  setupTimeoutSafety: function() {
      setTimeout(() => {
          if (this.preloader && this.preloader.style.display !== 'none') {
              console.warn('Preloader timeout: nascondo forzatamente');
              this.hidePreloader();
          }
      }, 5000);
  },
  
  /**
   * Nasconde forzatamente il preloader
   */
  hidePreloader: function() {
      if (this.preloader) {
          this.preloader.style.display = 'none';
          if (this.chatContainer) {
              this.chatContainer.style.opacity = '1';
          }
          
          const event = new Event('appReady');
          document.dispatchEvent(event);
      }
  }
};

// Esporta il modulo
window.PreloaderManager = PreloaderManager;

// Inizializza il preloader quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  window.PreloaderManager.init();
});