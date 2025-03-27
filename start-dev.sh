#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparazione dell'ambiente Docker per Villa Petriolo...${NC}"

# Create directories if they don't exist
mkdir -p frontend
mkdir -p backend/src/config
mkdir -p backend/src/controllers
mkdir -p backend/src/data
mkdir -p backend/src/middleware
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/scripts
mkdir -p backend/src/services
mkdir -p backend/src/services/ai
mkdir -p backend/src/utils

# Check if frontend/index.html exists, create if not
if [ ! -f "frontend/index.html" ]; then
  echo -e "${YELLOW}Creazione del file index.html per il frontend...${NC}"
  cp index.html frontend/index.html
  echo -e "${GREEN}Frontend configurato.${NC}"
fi

# Check if .env exists, create if not
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}Creazione del file .env per il backend...${NC}"
  cp .env backend/.env
  echo -e "${GREEN}File .env creato. Aggiorna i valori delle API key se necessario.${NC}"
fi

# Avvio di Docker Compose
echo -e "${YELLOW}Avvio di Docker Compose...${NC}"
docker-compose up -d

echo -e "${GREEN}Ambiente Docker avviato con successo!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend: http://localhost:3001${NC}"
echo -e "${GREEN}MongoDB: localhost:27017${NC}"
echo -e "${GREEN}Redis: localhost:6379${NC}"
echo -e "${YELLOW}Per inizializzare il database, esegui: docker-compose exec backend npm run init-db${NC}"
echo -e "${YELLOW}Per visualizzare i log: docker-compose logs -f${NC}"
echo -e "${YELLOW}Per fermare l'ambiente: docker-compose down${NC}"