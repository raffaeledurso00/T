FROM node:18-alpine

WORKDIR /app

# Copia package.json e package-lock.json
COPY backend/package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file dell'applicazione
COPY backend/ ./

# Espone la porta del backend
EXPOSE 3001

# Comando per avviare l'applicazione
CMD ["npm", "run", "dev"]