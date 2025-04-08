// frontend/js/ui/preloader/init.js

/**
 * Initializes the preloader animation when the DOM is loaded
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Check if GSAP is available
        if (typeof gsap !== 'undefined') {
            const preloader = document.getElementById('js-preloader');
            const loadingCircle = document.getElementById('loading-circle');
            const preloaderLogo = document.getElementById('preloader-logo');
            const chatContainer = document.querySelector('.chat-container');
            
            if (preloader && loadingCircle && preloaderLogo && chatContainer) {
                chatContainer.style.opacity = '0';
                
                // Circle animation
                gsap.fromTo(loadingCircle, 
                    { strokeDashoffset: 565.48 }, 
                    { 
                        strokeDashoffset: 0, 
                        duration: 2.5, 
                        ease: "power2.inOut",
                        onComplete: finishLoading
                    }
                );
                
                // Logo animation
                gsap.to(preloaderLogo, {
                    scale: 1.05,
                    duration: 1,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
                
                // Safety timeout
                setTimeout(() => {
                    if (preloader.style.display !== 'none') {
                        finishLoading();
                    }
                }, 5000);
                
                function finishLoading() {
                    gsap.killTweensOf(preloaderLogo);
                    
                    gsap.to(preloader, {
                        autoAlpha: 0,
                        duration: 0.8,
                        onComplete: () => {
                            preloader.style.display = 'none';
                            
                            gsap.to(chatContainer, {
                                opacity: 1,
                                duration: 0.6,
                                onComplete: () => {
                                    const event = new Event('appReady');
                                    document.dispatchEvent(event);
                                }
                            });
                        }
                    });
                }
            } else {
                // Fallback if elements are not found
                if (preloader) preloader.style.display = 'none';
                if (chatContainer) chatContainer.style.opacity = '1';
                
                setTimeout(() => {
                    const event = new Event('appReady');
                    document.dispatchEvent(event);
                }, 500);
            }
        } else {
            // Fallback if GSAP is not available
            const preloader = document.getElementById('js-preloader');
            const chatContainer = document.querySelector('.chat-container');
            
            if (preloader) preloader.style.display = 'none';
            if (chatContainer) chatContainer.style.opacity = '1';
            
            setTimeout(() => {
                const event = new Event('appReady');
                document.dispatchEvent(event);
            }, 500);
        }
    });
})();