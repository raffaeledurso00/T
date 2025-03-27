# Villa Petriolo Concierge Digitale

Un concierge digitale per Villa Petriolo che fornisce informazioni e assistenza agli ospiti attraverso un'interfaccia di chat semplice ed elegante.

## Descrizione

Questo progetto è composto da un frontend e un backend:
- **Frontend**: Un'interfaccia di chat sviluppata con HTML, CSS e JavaScript vanilla
- **Backend**: Un server Node.js con Express che utilizza Ollama per generare risposte personalizzate

Il concierge digitale è in grado di:
- Fornire informazioni sul menu del ristorante
- Suggerire attività disponibili nella struttura e nei dintorni
- Rispondere a domande generali sulla struttura e i servizi
- Mantenere una conversazione naturale con gli ospiti

## Requisiti

- [Node.js](https://nodejs.org/) (v14 o superiore)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Ollama](https://ollama.ai/) (opzionale ma consigliato per risposte più personalizzate)

## Installazione

### 1. Clonare il repository

```bash
git clone https://github.com/tuousername/villa-petriolo-concierge.git
cd villa-petriolo-concierge
```

### 2. Installare le dipendenze del backend

```bash
cd backend
npm install
```

### 3. Configurare le variabili d'ambiente

Crea un file `.env` nella cartella `backend` con il seguente contenuto:

```
PORT=3001
```

### 4. Installare Ollama (opzionale)

Per utilizzare Ollama per generare risposte:

1. Installa Ollama dal [sito ufficiale](https://ollama.ai/)
2. Esegui Ollama in background
3. Scarica il modello necessario:

```bash
ollama pull llama3.1:8b
```

## Avvio dell'applicazione

### Metodo 1: Script di avvio automatico

Nella cartella principale del progetto, esegui:

```bash
chmod +x start-dev.sh  # Solo la prima volta (su Unix/Linux/Mac)
./start-dev.sh
```

Questo script avvierà automaticamente sia il backend che il frontend.

### Metodo 2: Avvio manuale

#### Avvio del backend:

```bash
cd backend
npm run dev
```

#### Avvio del frontend:

In un nuovo terminale:

```bash
cd frontend
npx http-server -p 3000
```

## Accesso all'applicazione

Una volta avviati entrambi i servizi:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Personalizzazione

### Modifica del menu del ristorante

Modifica il file `backend/src/data/menu.json` per aggiornare i piatti disponibili.

### Modifica delle attività

Modifica il file `backend/src/data/attivita.json` per aggiornare le attività disponibili.

### Configurazione del modello LLM

Se utilizzi Ollama, puoi modificare i parametri del modello nel file `backend/src/config/modelConfig.js`.

## Funzionamento senza Ollama

Il sistema può funzionare anche senza Ollama, utilizzando risposte predefinite per domande comuni. Tuttavia, per un'esperienza più completa e personalizzata, è consigliabile utilizzare Ollama.

## Funzionalità

- **Chat persistenti**: Le conversazioni vengono salvate automaticamente e saranno disponibili anche dopo l'aggiornamento della pagina
- **Gestione delle chat**: Possibilità di creare nuove chat e di eliminare quelle esistenti
- **Risposte intuitive**: Il concierge può fornire informazioni su menu, attività e servizi dell'hotel
- **Interfaccia responsive**: Utilizzabile sia da desktop che da dispositivi mobili

## Struttura del progetto

```
villa-petriolo-concierge/
├── backend/                  # Server Node.js
│   ├── src/
│   │   ├── config/           # Configurazioni
│   │   ├── controllers/      # Controller delle richieste
│   │   ├── data/             # Dati statici (menu, attività)
│   │   ├── routes/           # Route dell'API
│   │   └── server.js         # Entry point del server
│   ├── package.json
│   └── .env                  # Variabili d'ambiente (da creare)
├── frontend/                 # Interfaccia utente
│   ├── css/
│   ├── img/
│   ├── js/
│   └── index.html
└── start-dev.sh              # Script di avvio
```

## Contributi

Sentiti libero di contribuire al progetto aprendo issue o inviando pull request.

## Licenza

[MIT](LICENSE)