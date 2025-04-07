// src/services/mistral/MistralService.js
const MistralApiClient = require('./MistralApiClient');
const ConversationManager = require('./ConversationManager');
const MessageDetectionUtils = require('./MessageDetectionUtils');
const ResponseFormatter = require('./ResponseFormatter');
const BookingIntegration = require('./BookingIntegration');
const LanguageDetector = require('./LanguageDetector');
const MultiLanguageHandler = require('./MultiLanguageHandler');
const linguisticPatch = require('./linguistic-patch');

// Set DEBUG to true for detailed logging
const DEBUG = true;

class MistralService {
    constructor() {
        this.apiClient = new MistralApiClient();
        this.conversationManager = new ConversationManager();
        this.messageDetection = new MessageDetectionUtils();
        this.responseFormatter = new ResponseFormatter();
        this.bookingIntegration = BookingIntegration;
        this.languageDetector = new LanguageDetector();
        this.multiLanguageHandler = new MultiLanguageHandler();
    }

    async processMessage(message, sessionId, userId = null) {
        try {
            console.log(`Processing message for session ${sessionId}: "${message}"`);
            
            // Rileva la lingua dell'ultimo messaggio dell'utente
            console.log(`\n====== ANALISI MESSAGGIO UTENTE ======`);  
            console.log(`[MistralService] Messaggio utente: "${message}"`);          
            
            // Estrai i caratteri cirillici per verifica debug
            let cyrillicChars = message.match(/[\u0400-\u04FF]/g) || [];
            console.log(`[MistralService] Caratteri cirillici nel messaggio: ${cyrillicChars.length}`);
            if (cyrillicChars.length > 0) {
                console.log(`[MistralService] Caratteri cirillici: "${cyrillicChars.join('')}"`); 
            }
            
            // Usa il patcher linguistico per verificare se è russo
            const russianAnalysis = linguisticPatch.forceRussianDetection(message);
            console.log(`[MistralService] Analisi russo: ${JSON.stringify(russianAnalysis)}`);
            
            // Se è russo, forza l'impostazione della lingua
            let detectedLanguage;
            if (russianAnalysis.isRussian) {
                detectedLanguage = 'ru';
                console.log(`[MistralService] FORZATO RILEVAMENTO: RUSSO (per presenza caratteri cirillici)`);  
            } else {
                // Altrimenti usa il normale rilevamento linguistico
                detectedLanguage = this.languageDetector.detect(message);
            }
            
            console.log(`[MistralService] *********** LINGUA RILEVATA: ${detectedLanguage} ***********`);
            console.log('====== FINE ANALISI MESSAGGIO UTENTE ======\n');
            
            // Verifica e gestione delle diverse richieste
            
            // 0. Verifica se è un semplice saluto per dare una risposta minimale
            if (message.toLowerCase().trim().match(/^(ciao|salve|buongiorno|buonasera|hi|hello|hey)$/)) {
                console.log(`[MistralService] Rilevato saluto semplice`);
                const greetingResponses = [
                    "Buongiorno! Come posso aiutarla oggi?",
                    "Salve! In cosa posso esserle utile?",
                    "Benvenuto a Villa Petriolo. Cosa posso fare per lei?",
                    "Ciao! Sono il concierge digitale. Come posso assisterla?"
                ];
                
                const response = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
                
                // Salva nella conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: response });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: response,
                    sessionId: sessionId,
                    source: 'greeting-handler',
                    language: detectedLanguage
                };
            }
            
            // 1. Verifica se si tratta di una richiesta di informazioni sul ristorante
            if (this.isRestaurantInfoRequest(message)) {
                console.log(`[MistralService] Rilevata richiesta info ristorante`);
                const restaurantResponse = this.handleRestaurantRequest(message);
                
                // Salva nella conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: restaurantResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: restaurantResponse,
                    sessionId: sessionId,
                    source: 'restaurant-info',
                    language: detectedLanguage
                };
            }
            
            // 2. Verifica se si tratta di una richiesta di attività
            if (this.isActivitiesInfoRequest(message)) {
                console.log(`[MistralService] Rilevata richiesta info attività`);
                const activitiesResponse = this.handleActivitiesRequest(message);
                
                // Salva nella conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: activitiesResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: activitiesResponse,
                    sessionId: sessionId,
                    source: 'activities-info',
                    language: detectedLanguage
                };
            }
            
            // 3. Verifica se si tratta di una richiesta di eventi
            if (this.isEventsInfoRequest(message)) {
                console.log(`[MistralService] Rilevata richiesta info eventi`);
                const eventsResponse = this.handleEventsRequest(message);
                
                // Salva nella conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: eventsResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: eventsResponse,
                    sessionId: sessionId,
                    source: 'events-info',
                    language: detectedLanguage
                };
            }
            
            // 4. Verifica se si tratta di una richiesta di servizi
            if (this.isServicesInfoRequest(message)) {
                console.log(`[MistralService] Rilevata richiesta info servizi`);
                const servicesResponse = this.handleServicesRequest(message);
                
                // Salva nella conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: servicesResponse });
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: servicesResponse,
                    sessionId: sessionId,
                    source: 'services-info',
                    language: detectedLanguage
                };
            }
            
            // SOLUZIONE RAPIDA PER IL RUSSO: Se la lingua è russa, ignora Mistral e usa una risposta predefinita
            if (detectedLanguage === 'ru' && russianAnalysis.isRussian) {
                console.log(`[MistralService] SOLUZIONE IMMEDIATA: Messaggio in russo rilevato, uso risposta predefinita`);
                // Ottieni una risposta predefinita in russo
                const russianResponse = linguisticPatch.getRussianFallbackResponse();
                
                // Salva nella storia della conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                
                // Aggiungi il messaggio utente alla storia
                history.push({
                    role: 'user',
                    content: message
                });
                
                // Aggiungi la risposta russa predefinita
                history.push({
                    role: 'assistant',
                    content: russianResponse
                });
                
                // Aggiorna la storia
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: russianResponse,
                    sessionId: sessionId,
                    source: 'russian-fallback',
                    language: 'ru'
                };
            }
            
            // Gestione per richieste ristorante
            if (this.isRestaurantBookingRequest(message)) {
                const restaurantResponse = this.handleRestaurantRequest(message);
                
                // Salva nella storia della conversazione
                const history = await this.conversationManager.getConversationHistory(sessionId);
                
                // Aggiungi il messaggio utente alla storia
                history.push({
                    role: 'user',
                    content: message
                });
                
                // Aggiungi la risposta come messaggio dell'assistente
                history.push({
                    role: 'assistant',
                    content: restaurantResponse
                });
                
                // Aggiorna la storia
                await this.conversationManager.updateConversationHistory(sessionId, history);
                
                return {
                    message: restaurantResponse,
                    sessionId: sessionId,
                    source: 'restaurant-system',
                    language: detectedLanguage
                };
            }
            
            // Verifica se il messaggio è relativo alle prenotazioni
            if (this.bookingIntegration.isBookingRelatedQuery(message) && userId) {
                const bookingResponse = await this.bookingIntegration.handleBookingQuery(message, userId);
                
                if (bookingResponse) {
                    // Se abbiamo una risposta valida dalla gestione prenotazioni, la utilizziamo
                    // e la memorizziamo nella storia della conversazione
                    const history = await this.conversationManager.getConversationHistory(sessionId);
                    
                    // Aggiungi il messaggio utente alla storia
                    history.push({
                        role: 'user',
                        content: message
                    });
                    
                    // Aggiungi la risposta del sistema di prenotazione come messaggio dell'assistente
                    history.push({
                        role: 'assistant',
                        content: bookingResponse
                    });
                    
                    // Aggiorna la storia
                    await this.conversationManager.updateConversationHistory(sessionId, history);
                    
                    return {
                        message: bookingResponse,
                        sessionId: sessionId,
                        source: 'booking-system',
                        language: detectedLanguage
                    };
                }
            }
            
            // Se non è una query di prenotazione o non abbiamo ottenuto una risposta,
            // procedi con il normale flusso Mistral
            
            // Get conversation history
            const history = await this.conversationManager.getConversationHistory(sessionId);
            
            // Add user message to history
            history.push({
                role: 'user',
                content: message
            });
            
            // Analisi del contesto della conversazione
            const topic = this.detectMessageTopic(message);
            console.log(`[MistralService] Topic rilevato per il prompt di sistema: ${topic}`);
            
            // Prepara un contesto base
            let contextContent = `Sei il concierge digitale di Villa Petriolo. IMPORTANTE: Sii MOLTO CONCISO nelle tue risposte. `;
            contextContent += `Le tue risposte devono essere brevi, precise e dirette. MAI più di 2-3 frasi per risposte generali, massimo 5-6 righe per informazioni specifiche. `;
            contextContent += `NON aggiungere informazioni non richieste. NON elencare tutti i servizi disponibili a meno che non sia espressamente richiesto.\n\n`;
            
            // Aggiungi informazioni specifiche in base al topic rilevato
            if (topic === 'menu') {
                contextContent += `INFORMAZIONI SUL RISTORANTE:\n` +
                                 `- Orari pranzo: 12:30 - 14:30\n` +
                                 `- Orari cena: 19:30 - 22:30\n` +
                                 `- Aperto tutti i giorni\n\n` +
                                 `MENU DISPONIBILE:\n` +
                                 `- Antipasti: Carpaccio di manzo (€16), Burrata con pomodorini (€14), Tagliere di salumi (€18)\n` +
                                 `- Primi: Pappardelle al ragù di cinghiale (€18), Risotto ai funghi porcini (€16)\n` +
                                 `- Secondi: Bistecca alla fiorentina (€70 per 2), Filetto di branzino (€24)\n` +
                                 `- Dolci: Tiramisù (€8), Panna cotta (€8), Cantucci e Vin Santo (€10)\n\n`;
            } else if (topic === 'attivita') {
                contextContent += `ATTIVITÀ DISPONIBILI:\n` +
                                 `- Nella struttura: Degustazione vini (17:00, €35), Corso di cucina (lun/mer/ven 10:00, €65)\n` +
                                 `- Passeggiata guidata nel bosco (mar/gio 9:30, €20), Yoga nel parco (ogni giorno 8:00, €15)\n` +
                                 `- Nei dintorni: Tour del Chianti (mezza giornata, €85), Visita a San Gimignano (€60)\n\n`;
            } else if (topic === 'eventi') {
                contextContent += `EVENTI IN PROGRAMMA:\n` +
                                 `- Settimanali: Degustazione olio (martedì, 19:00, €25), Concerto dal vivo (venerdì, 21:00, €15)\n` +
                                 `- Aperitivo al tramonto (ogni giorno, 18:30, €20)\n` +
                                 `- Speciali: Festival del Vino (primo weekend del mese, €75), Cooking Masterclass (ultimo sabato, €120)\n\n`;
            } else if (topic === 'servizi') {
                contextContent += `SERVIZI DISPONIBILI:\n` +
                                 `- Servizi base: Reception (24h), Servizio in camera (7:00-23:00), Wi-Fi gratuito, Parcheggio\n` +
                                 `- Benessere: Spa (10:00-20:00), Massaggi (da €60), Piscina esterna (8:00-19:00, mag-set)\n` +
                                 `- Extra: Trasferimento aeroporto (da €80), Noleggio biciclette (€15/ora), Servizio lavanderia\n\n`;
            } else {
                // Contesto generico con informazioni di base
                contextContent += `INFORMAZIONI GENERALI:\n` +
                                 `- Ristorante: Pranzo 12:30-14:30, Cena 19:30-22:30, tutti i giorni\n` +
                                 `- Attività principali: Degustazione vini (€35), Corso di cucina (€65), Yoga (€15)\n` +
                                 `- Servizi: Wi-Fi gratuito, Reception 24h, Spa e centro benessere (10:00-20:00)\n\n`;
            }
            
            // Aggiungi una nota importante per garantire risposte accurate
            contextContent += `IMPORTANTE: Fornisci sempre orari e prezzi precisi quando richiesti. NON essere prolisso, risposte brevi e dirette.`;
            
            // Crea il prompt di sistema con il contesto arricchito
            const contextPrompt = {
                role: 'system',
                content: contextContent
            };
            
            // Arricchisci la storia con il contesto
            const enrichedHistory = [contextPrompt, ...history];
            
            // Get response from API
            const response = await this.apiClient.callMistralAPI(enrichedHistory, message, this.messageDetection, this.responseFormatter);
            let assistantMessage = response.content;
            
            if (DEBUG) console.log(`Got assistant response: "${assistantMessage}"`);
            
            // Check if the language of the response matches the detected language of the user message
            console.log(`\n====== ANALISI RISPOSTA MISTRAL ======`);
            console.log(`[MistralService] Risposta originale da Mistral: "${assistantMessage}"`);
            console.log(`[MistralService] Lingua rilevata nel messaggio utente: ${detectedLanguage}`);
            
            // Verifica la correttezza linguistica della risposta
            try {
                // Verifica se è un saluto semplice per usare template predefiniti
                if (this.messageDetection.isSimpleGreeting(message)) {
                    const originalResponse = assistantMessage;
                    assistantMessage = this.multiLanguageHandler.getRandomGreeting(detectedLanguage);
                    console.log(`[MistralService] Era un saluto semplice, sostituisco con greeting template`);
                    console.log(`[MistralService] PRIMA: "${originalResponse}"`);
                    console.log(`[MistralService] DOPO: "${assistantMessage}"`);
                } else {
                    // Analisi approfondita della risposta per verificare la correttezza linguistica
                    console.log('[MistralService] Analisi linguistica della risposta:');
                    
                    // Utilizza la funzione migliorata di linguisticPatch
                    const isResponseCorrect = linguisticPatch.isResponseInCorrectLanguage(assistantMessage, detectedLanguage);
                    console.log(`[MistralService] - Risposta nella lingua corretta: ${isResponseCorrect}`);
                    
                    // Per il russo, implementiamo una soluzione speciale per garantire la risposta corretta
                    if (detectedLanguage === 'ru') {
                        const isResponseRussian = linguisticPatch.isResponseInCorrectLanguage(assistantMessage, 'ru');
                        console.log(`[MistralService] Risposta in russo? ${isResponseRussian}`);
                        
                        if (!isResponseRussian) {
                            console.log(`[MistralService] ERRORE: La risposta non è in russo. Sostituisco con risposta preimpostata.`);
                            assistantMessage = linguisticPatch.getRussianFallbackResponse();
                            console.log(`[MistralService] Risposta finale: "${assistantMessage}"`);
                        }
                    }
                    // Se la risposta non è nella lingua corretta, usa il sistema avanzato di fallback
                    else if (!isResponseCorrect) {
                        console.log(`[MistralService] ATTENZIONE: La risposta non è nella lingua corretta: ${detectedLanguage}`);
                        
                        // Try-catch per gestire eventuali errori nel processo di traduzione
                        try {
                            const originalResponse = assistantMessage;
                            // Usa il nuovo sistema di traduzione fallback
                            assistantMessage = await linguisticPatch.translateWithFallback(assistantMessage, detectedLanguage);
                            console.log(`[MistralService] Applicato fallback linguistico:`);
                            console.log(`[MistralService] PRIMA: "${originalResponse.substring(0, 100)}..."`);
                            console.log(`[MistralService] DOPO: "${assistantMessage.substring(0, 100)}..."`);
                            
                            // Verifica speciale per il menu
                            if (this.messageDetection.isAboutMenu(message)) {
                                assistantMessage = this.multiLanguageHandler.localizeMenuSections(assistantMessage, detectedLanguage);
                                console.log(`[MistralService] Localizzazione aggiuntiva sezioni menu`);
                            }
                        } catch (translationError) {
                            console.error(`[MistralService] Errore durante il fallback linguistico:`, translationError);
                            // Fallback finale: usa un messaggio di errore predefinito nella lingua corretta
                            assistantMessage = this.multiLanguageHandler.getErrorMessage(detectedLanguage);
                        }
                    }
                }
            } catch (languageProcessingError) {
                console.error('[MistralService] Errore durante l\'elaborazione linguistica:', languageProcessingError);
                // Non interrompere il flusso, lascia la risposta originale
            }
            
            console.log(`====== FINE ANALISI RISPOSTA MISTRAL ======\n`);
            
            // Add assistant response to history
            history.push({
                role: 'assistant',
                content: assistantMessage
            });
            
            // Update conversation history
            await this.conversationManager.updateConversationHistory(sessionId, history);
            
            return {
                message: assistantMessage,
                sessionId: sessionId,
                source: 'mistral-ai',
                language: detectedLanguage
            };
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Return a fallback response in case of error
            return {
                message: "Mi scusi, si è verificato un errore nella comunicazione. Può riprovare tra qualche istante?",
                sessionId: sessionId,
                error: true,
                source: 'error-handler',
                language: detectedLanguage || 'it'
            };
        }
    }

    // Funzione per identificare le richieste di prenotazione ristorante
    isRestaurantBookingRequest(message) {
        const lowerMsg = message.toLowerCase();
        const restaurantKeywords = [
            'prenota', 'tavolo', 'ristorante', 'cena', 'pranzo', 'mangiare',
            'prenotare', 'riservare', 'posto', 'bistrot', 'stasera', 'domani'
        ];
        
        // Deve essere una richiesta di prenotazione, non solo una domanda generica sul ristorante
        const bookingWords = ['prenota', 'prenotare', 'riservare', 'tavolo', 'posto'];
        const hasBookingIntent = bookingWords.some(word => lowerMsg.includes(word));
        
        return hasBookingIntent && restaurantKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    // Funzione per identificare richieste di informazioni sul ristorante (non prenotazioni)
    isRestaurantInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const restaurantKeywords = [
            'ristorante', 'cena', 'pranzo', 'orari', 'menu', 'piatti', 'mangiare', 
            'cucina', 'chef', 'cuoco', 'specialità', 'colazione', 'quando', 'aperto'
        ];
        
        // Deve contenere almeno una parola chiave ma non essere una richiesta di prenotazione
        return restaurantKeywords.some(keyword => lowerMsg.includes(keyword)) && !this.isRestaurantBookingRequest(message);
    }
    
    // Funzione per identificare richieste di informazioni sulle attività
    isActivitiesInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const activityKeywords = [
            'attività', 'fare', 'tour', 'passeggiata', 'escursione', 'visita', 
            'cosa fare', 'divertimento', 'attrazione', 'esperienza', 'visite guidate'
        ];
        
        return activityKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    // Funzione per identificare richieste di informazioni sugli eventi
    isEventsInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const eventsKeywords = [
            'eventi', 'programma', 'concerto', 'spettacolo', 'degustazione', 'festa', 
            'calendario', 'cosa c\'è', 'cosa succede', 'intrattenimento', 'serata'
        ];
        
        return eventsKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    // Funzione per gestire le richieste sugli eventi
    handleEventsRequest(message) {
        const lowerMsg = message.toLowerCase();
        let eventsResponse = "Ecco gli eventi in programma:\n\n";
        
        // Eventi regolari
        eventsResponse += `EVENTI REGOLARI:\n` +
                          `- Serata di degustazione olio d'oliva: degustazione guidata degli oli prodotti nella tenuta\n` +
                          `  Quando: ogni martedì, Orario: 19:00 - 20:30, Luogo: Sala degustazione\n` +
                          `  Prezzo: €25, Prenotazione: richiesta\n\n` +
                          `- Concerto di musica dal vivo: musica jazz e classica con artisti locali\n` +
                          `  Quando: ogni venerdì, Orario: 21:00 - 23:00, Luogo: Terrazza panoramica\n` +
                          `  Prezzo: €15, Prenotazione: consigliata\n\n` +
                          `- Aperitivo al tramonto: aperitivo con vista panoramica sulle colline toscane\n` +
                          `  Quando: ogni giorno, Orario: 18:30 - 20:00, Luogo: Bar della piscina\n` +
                          `  Prezzo: €20, Prenotazione: non necessaria\n\n`;
        
        // Eventi speciali (se richiesti esplicitamente o come parte di una risposta completa)
        if (lowerMsg.includes('special') || lowerMsg.includes('tutt')) {
            eventsResponse += `EVENTI SPECIALI:\n` +
                              `- Festival del Vino: un weekend dedicato ai migliori vini della Toscana\n` +
                              `  Quando: primo weekend di ogni mese, Durata: 3 giorni\n` +
                              `  Luogo: Cantina e giardini della villa\n` +
                              `  Prezzo: €75, Prenotazione: richiesta con anticipo\n\n` +
                              `- Cooking Masterclass: masterclass con chef stellati ospiti\n` +
                              `  Quando: ultimo sabato del mese, Orario: 10:00 - 15:00\n` +
                              `  Luogo: Cucina professionale\n` +
                              `  Prezzo: €120, Prenotazione: obbligatoria con anticipo\n\n`;
        }
        
        return eventsResponse + "Per ulteriori informazioni o prenotazioni, contatti la reception.";
    }
    
    // Funzione per identificare richieste di informazioni sui servizi
    isServicesInfoRequest(message) {
        const lowerMsg = message.toLowerCase();
        const servicesKeywords = [
            'servizi', 'servizio', 'wifi', 'internet', 'parcheggio', 'reception', 
            'pulizia', 'navetta', 'trasporto', 'spa', 'massaggio', 'benessere', 'piscina'
        ];
        
        return servicesKeywords.some(keyword => lowerMsg.includes(keyword));
    }
    
    // Funzione per gestire le richieste sui servizi
    handleServicesRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // Risposta sui servizi hotel
        if (lowerMsg.includes('hotel') || lowerMsg.includes('struttura') ||
            lowerMsg.includes('recept') || lowerMsg.includes('camere')) {
            return `Ecco i servizi principali del nostro hotel:\n\n` +
                   `- Reception: servizio di accoglienza e assistenza agli ospiti disponibile 24 ore su 24\n\n` +
                   `- Servizio in camera: servizio di ristorazione in camera (orari: 7:00 - 23:00)\n\n` +
                   `- Concierge: assistenza per prenotazioni, informazioni e servizi personalizzati (orari: 8:00 - 22:00)\n\n` +
                   `- Pulizia camere: servizio di pulizia giornaliera delle camere (orari: 9:00 - 14:00)\n\n` +
                   `- Wi-Fi: connessione gratuita in tutta la struttura\n\n` +
                   `- Parcheggio: parcheggio gratuito per gli ospiti\n\n`;
        }
        
        // Risposta sui servizi benessere
        if (lowerMsg.includes('benesser') || lowerMsg.includes('spa') ||
            lowerMsg.includes('massagg') || lowerMsg.includes('relax')) {
            return `Ecco i nostri servizi benessere:\n\n` +
                   `- Spa e centro benessere: sauna, bagno turco, piscina interna riscaldata e area relax\n` +
                   `  Orari: 10:00 - 20:00\n` +
                   `  Prezzo: accesso incluso per gli ospiti, trattamenti a pagamento\n\n` +
                   `- Massaggi: rilassante, decontratturante, aromaterapico\n` +
                   `  Orari: 11:00 - 19:00\n` +
                   `  Prezzo: da €60 per 50 minuti, prenotazione richiesta\n\n` +
                   `- Trattamenti viso: trattamenti viso personalizzati\n` +
                   `  Orari: 11:00 - 19:00\n` +
                   `  Prezzo: da €45 per 30 minuti, prenotazione richiesta\n\n` +
                   `- Piscina esterna: con vista sulle colline\n` +
                   `  Orari: 8:00 - 19:00 (maggio-settembre)\n` +
                   `  Prezzo: incluso nel soggiorno\n\n`;
        }
        
        // Risposta sui servizi extra
        if (lowerMsg.includes('extra') || lowerMsg.includes('aggiuntiv') ||
            lowerMsg.includes('trasferimento') || lowerMsg.includes('trasport')) {
            return `Ecco i servizi extra disponibili:\n\n` +
                   `- Trasferimento aeroporto: servizio da/per gli aeroporti di Firenze e Pisa\n` +
                   `  Prezzo: da €80 a tratta, prenotazione richiesta con 24 ore di anticipo\n\n` +
                   `- Noleggio biciclette: biciclette tradizionali ed elettriche\n` +
                   `  Orari: 9:00 - 18:00\n` +
                   `  Prezzo: €15 all'ora o €45 al giorno, prenotazione consigliata\n\n` +
                   `- Servizio lavanderia: lavaggio e stiratura dei capi\n` +
                   `  Orari: 8:00 - 17:00\n` +
                   `  Prezzo: secondo listino in camera\n\n` +
                   `- Baby sitting: su richiesta\n` +
                   `  Prezzo: €25 all'ora, prenotazione richiesta con 24 ore di anticipo\n\n`;
        }
        
        // Risposta generale su tutti i servizi
        return `Ecco i principali servizi disponibili presso Villa Petriolo:\n\n` +
               `SERVIZI HOTEL:\n` +
               `- Reception (24 ore)\n` +
               `- Servizio in camera (7:00 - 23:00)\n` +
               `- Wi-Fi gratuito in tutta la struttura\n\n` +
               `SERVIZI BENESSERE:\n` +
               `- Spa e centro benessere (10:00 - 20:00)\n` +
               `- Massaggi (11:00 - 19:00)\n` +
               `- Piscina esterna (8:00 - 19:00, maggio-settembre)\n\n` +
               `Per ulteriori dettagli o per prenotare un servizio, non esiti a contattare la reception.`;
    }
    
    // Funzione per gestire le richieste sulle attività
    handleActivitiesRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // Risposta sulle attività nella struttura
        if (lowerMsg.includes('struttura') || lowerMsg.includes('qui') ||
            lowerMsg.includes('villa')) {
            return `Ecco le attività disponibili nella nostra struttura:\n\n` +
                   `- Degustazione vini: degustazione guidata dei migliori vini locali con il nostro sommelier\n` +
                   `  Orari: Tutti i giorni alle 17:00, Durata: 90 minuti, Prezzo: €35\n\n` +
                   `- Corso di cucina toscana: impara a preparare piatti tipici con il nostro chef\n` +
                   `  Orari: Lunedì, mercoledì e venerdì alle 10:00, Durata: 3 ore, Prezzo: €65\n\n` +
                   `- Passeggiata guidata nel bosco: esplora i boschi circostanti con una guida naturalistica\n` +
                   `  Orari: Martedì e giovedì alle 9:30, Durata: 2 ore, Prezzo: €20\n\n` +
                   `- Yoga nel parco: sessione di yoga all'aperto nel parco della villa\n` +
                   `  Orari: Tutti i giorni alle 8:00, Durata: 60 minuti, Prezzo: €15\n\n` +
                   `Per prenotazioni, si prega di rivolgersi alla reception o contattarci al numero interno 100.`;
        }
        
        // Risposta sulle attività nei dintorni
        if (lowerMsg.includes('dintorni') || lowerMsg.includes('fuori') ||
            lowerMsg.includes('vicino')) {
            return `Ecco le attività disponibili nei dintorni:\n\n` +
                   `- Tour del Chianti: visita delle cantine più rinomate della regione del Chianti\n` +
                   `  Distanza: 30 minuti di auto, Durata: mezza giornata, Prezzo: €85\n\n` +
                   `- Visita a San Gimignano: escursione alla città medievale delle torri\n` +
                   `  Distanza: 45 minuti di auto, Durata: mezza giornata, Prezzo: €60\n\n` +
                   `- Tour in bici delle colline toscane: escursione in bicicletta tra le pittoresche colline\n` +
                   `  Distanza: partenza dalla struttura, Durata: 3-4 ore, Prezzo: €40\n\n` +
                   `- Visita a Firenze: tour guidato della città d'arte\n` +
                   `  Distanza: 1 ora di auto, Durata: giornata intera, Prezzo: €90\n\n` +
                   `Possiamo organizzare il trasporto e le prenotazioni. Contatti la reception per maggiori dettagli.`;
        }
        
        // Risposta generale su tutte le attività
        return `Ecco alcune attività che può fare durante il suo soggiorno:\n\n` +
               `NELLA STRUTTURA:\n` +
               `- Degustazione vini (tutti i giorni, €35)\n` +
               `- Corso di cucina toscana (lun, mer, ven, €65)\n` +
               `- Yoga nel parco (ogni mattina, €15)\n\n` +
               `NEI DINTORNI:\n` +
               `- Tour del Chianti (30 minuti di auto, €85)\n` +
               `- Visita a San Gimignano (45 minuti di auto, €60)\n` +
               `- Tour in bici delle colline toscane (€40)\n\n` +
               `Per ulteriori dettagli su specifiche attività o per prenotazioni, non esiti a chiedere.`;
    }

    // Funzione per gestire le richieste di prenotazione ristorante
    handleRestaurantRequest(message) {
        const lowerMsg = message.toLowerCase();
        
        // Se è una richiesta diretta di prenotazione
        if (lowerMsg.includes('prenota') || lowerMsg.includes('prenotare') || 
            lowerMsg.includes('riservare') || lowerMsg.includes('vorrei un tavolo')) {
            
            return "Sarei felice di aiutarla con la prenotazione al nostro ristorante. " +
                   "Per procedere, avrei bisogno delle seguenti informazioni:\n\n" +
                   "- Data e orario desiderati\n" +
                   "- Numero di persone\n" +
                   "- Eventuali richieste speciali (es. tavolo all'aperto, menu per celiaci, ecc.)\n\n" +
                   "Potrebbe fornirmi questi dettagli? In alternativa, posso anche metterla in contatto " +
                   "direttamente con il nostro staff di ristorazione al numero interno 122 o via email a " +
                   "ristorante@villapetriolo.com";
        }
        
        // Se è una richiesta di informazioni sul ristorante: orari specifici e dettagliati
        if (lowerMsg.includes('orari') || lowerMsg.includes('quando') || 
            lowerMsg.includes('aperto') || lowerMsg.includes('a che ora')) {
            
            return "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n\n" +
                   "ORARI:\n" +
                   "- Pranzo: 12:30 - 14:30\n" +
                   "- Cena: 19:30 - 22:30\n\n" +
                   "Le prenotazioni sono consigliate, specialmente per la cena. " +
                   "Può prenotare al numero interno 122 o via email a ristorante@villapetriolo.com.";
        }
        
        // Se è una richiesta sul menu o sui piatti
        if (lowerMsg.includes('menu') || lowerMsg.includes('piatti') || 
            lowerMsg.includes('specialità') || lowerMsg.includes('cosa') && lowerMsg.includes('mangiare')) {
            
            return "Ecco il nostro menu attuale:\n\n" +
                   "ANTIPASTI:\n" +
                   "- Carpaccio di manzo con scaglie di parmigiano (€16)\n" +
                   "- Burrata con pomodorini e basilico (€14)\n" +
                   "- Tagliere di salumi e formaggi toscani (€18)\n\n" +
                   "PRIMI:\n" +
                   "- Pappardelle al ragù di cinghiale (€18)\n" +
                   "- Risotto ai funghi porcini (€16)\n" +
                   "- Spaghetti alle vongole (€18)\n\n" +
                   "SECONDI:\n" +
                   "- Bistecca alla fiorentina (per 2 persone) (€70)\n" +
                   "- Filetto di branzino con verdure di stagione (€24)\n" +
                   "- Tagliata di manzo con rucola e parmigiano (€26)\n\n" +
                   "DOLCI:\n" +
                   "- Tiramisù della casa (€8)\n" +
                   "- Panna cotta ai frutti di bosco (€8)\n" +
                   "- Cantucci e Vin Santo (€10)\n\n" +
                   "Il menu può variare leggermente in base alla stagionalità degli ingredienti.";
        }
        
        // Risposta generica per altre richieste relative al ristorante
        return "Il nostro ristorante è aperto tutti i giorni con i seguenti orari:\n" +
               "- Pranzo: 12:30 - 14:30\n" +
               "- Cena: 19:30 - 22:30\n\n" +
               "Offriamo una cucina tradizionale toscana con prodotti freschi e locali. " +
               "Il nostro chef propone un menu che include specialità come pappardelle al cinghiale, " +
               "bistecca alla fiorentina e una selezione di dolci fatti in casa.\n\n" +
               "Per prenotazioni può contattarci al numero interno 122 o via email a " +
               "ristorante@villapetriolo.com.";
    }

    async clearHistory(sessionId) {
        try {
            if (DEBUG) console.log(`Clearing history for session ${sessionId}`);
            
            await this.conversationManager.clearHistory(sessionId);
            
            // Reinitialize the conversation
            await this.conversationManager.initializeConversation(sessionId);
            
            return {
                message: "Storia della conversazione cancellata con successo.",
                sessionId: sessionId
            };
        } catch (error) {
            console.error('Error clearing history:', error);
            return {
                message: "Si è verificato un errore durante la cancellazione della conversazione.",
                sessionId: sessionId,
                error: true
            };
        }
    }

    async initializeConversation(sessionId) {
        try {
            await this.conversationManager.initializeConversation(sessionId);
            return true;
        } catch (error) {
            console.error('Error initializing conversation:', error);
            throw error;
        }
    }
}

module.exports = MistralService;