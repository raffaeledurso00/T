FROM node:18-alpine

WORKDIR /app

# Copia package.json, package-lock.json e lo script di installazione
COPY backend/package*.json ./
COPY backend/install-deps.js ./

# Installa le dipendenze
RUN npm install && node install-deps.js

# Copia il resto dei file dell'applicazione
COPY backend/ ./

# Espone la porta del backend
EXPOSE 3001

# Comando per avviare l'applicazione
CMD ["npm", "run", "dev"]