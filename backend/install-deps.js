// Controlla se bcrypt è installato correttamente
try {
  require('bcrypt');
  console.log('✅ bcrypt è installato correttamente');
} catch (error) {
  console.log('⚠️ Problema con bcrypt, ricompilazione necessaria');
  try {
    console.log('🔄 Ricompilazione di bcrypt...');
    execSync('npm rebuild bcrypt --build-from-source', { stdio: 'inherit' });
    console.log('✅ Ricompilazione di bcrypt completata!');
  } catch (rebuildError) {
    console.error('❌ Errore durante la ricompilazione di bcrypt:', rebuildError.message);
  }
}
// install-deps.js - Script per installare automaticamente tutte le dipendenze necessarie
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Elenco delle dipendenze che devono essere presenti
const requiredDependencies = [
  'express',
  'cookie-parser',
  'passport',
  'passport-jwt',
  'passport-google-oauth20',
  'mongoose',
  'bcrypt',
  'jsonwebtoken',
  'morgan',
  'cors',
  'dotenv',
  'helmet',
  'express-validator',
  'ioredis',
  'express-rate-limit',
  '@mistralai/mistralai'
];

console.log('🔍 Verifica delle dipendenze richieste...');

// Controlla se node_modules esiste e contiene le dipendenze
const isNodeModulesPresent = fs.existsSync(path.join(__dirname, 'node_modules'));
const missingDeps = [];

if (isNodeModulesPresent) {
  // Verifica quali dipendenze mancano
  requiredDependencies.forEach(dep => {
    const depPath = path.join(__dirname, 'node_modules', dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  });
} else {
  // Se node_modules non esiste, tutte le dipendenze sono mancanti
  missingDeps.push(...requiredDependencies);
}

// Installa le dipendenze mancanti
if (missingDeps.length > 0) {
  console.log(`⚠️ Trovate ${missingDeps.length} dipendenze mancanti.`);
  console.log('📦 Installazione dipendenze mancanti: ' + missingDeps.join(', '));
  
  try {
    execSync(`npm install ${missingDeps.join(' ')} --save`, { stdio: 'inherit' });
    console.log('✅ Installazione completata con successo!');
  } catch (error) {
    console.error('❌ Errore durante l\'installazione delle dipendenze:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Tutte le dipendenze richieste sono già installate.');
}

console.log('🚀 Avvio dell\'applicazione...');
