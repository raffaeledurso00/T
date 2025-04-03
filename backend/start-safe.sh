#!/bin/bash
# Script per avviare il backend in modo sicuro

echo "🔍 Verifica delle dipendenze..."
if [ ! -d "node_modules/cookie-parser" ]; then
    echo "⚠️ Dipendenza cookie-parser mancante, installazione in corso..."
    npm install cookie-parser --save
fi

if [ ! -d "node_modules/passport" ]; then
    echo "⚠️ Dipendenza passport mancante, installazione in corso..."
    npm install passport --save
fi

echo "🚀 Avvio del backend..."
npm run dev
