#!/bin/bash
# Script per riparare le dipendenze del backend

echo "🔧 Riparazione delle dipendenze del backend..."
echo "⚙️ Installazione di cookie-parser..."
npm install cookie-parser --save

echo "⚙️ Installazione di passport..."
npm install passport --save

echo "⚙️ Installazione di altre dipendenze potenzialmente mancanti..."
npm install passport-jwt passport-google-oauth20 jsonwebtoken express-validator --save

echo "🧹 Pulizia della cache di npm..."
npm cache clean --force

echo "🔄 Reinstallazione di tutte le dipendenze..."
rm -rf node_modules
npm install

echo "✅ Processo di riparazione completato!"
