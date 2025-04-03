// Script per testare il rilevamento di caratteri cirillici
const fs = require('fs');
const path = require('path');

// Test di caratteri cirillici
const cyrillicTestStrings = [
    "ПРИВЕТ", // "Ciao" in russo
    "Привет", // Versione lowercase
    "привет", // Versione completamente lowercase
    "П Р И В Е Т", // Con spazi
    "привет мир", // "Ciao mondo" in russo
    "привет123", // Con numeri
    "здравствуйте", // "Saluti" in russo
    'ПРИВЕТ' // Versione con apici singoli
];

console.log('===== TEST RILEVAMENTO CARATTERI CIRILLICI =====');

cyrillicTestStrings.forEach((testString, index) => {
    console.log(`\nTest #${index + 1}: "${testString}"`);
    console.log(`Lunghezza stringa: ${testString.length}`);
    
    // Dettagli caratteri
    console.log('Analisi caratteri:');
    for (let i = 0; i < testString.length; i++) {
        const char = testString[i];
        const code = char.charCodeAt(0);
        console.log(`  Carattere #${i+1}: '${char}' (Unicode: ${code}, Hex: 0x${code.toString(16)})`);
    }
    
    // Test per pattern cirillico
    const isCyrillic = /[\u0400-\u04FF]/.test(testString);
    const cyrillicMatches = testString.match(/[\u0400-\u04FF]/g);
    
    console.log(`Contiene caratteri cirillici: ${isCyrillic}`);
    console.log(`Caratteri cirillici trovati: ${cyrillicMatches ? cyrillicMatches.length : 0}`);
    if (cyrillicMatches) {
        console.log(`Caratteri cirillici: "${cyrillicMatches.join('')}"`);
    }
    
    // Test per il range specifico di ogni carattere
    console.log('Verifica range unicode:');
    for (let i = 0; i < testString.length; i++) {
        const char = testString[i];
        const code = char.charCodeAt(0);
        
        // Verifica range cirillico
        const isInCyrillicRange = code >= 0x0400 && code <= 0x04FF;
        console.log(`  '${char}' (${code}): ${isInCyrillicRange ? 'È CIRILLICO' : 'NON è cirillico'}`);
    }
});

console.log('\n===== FINE TEST =====');

// Salva anche l'output in un file per riferimento
const outputPath = path.join(__dirname, 'cyrillic-test-output.txt');
const logStream = fs.createWriteStream(outputPath);

// Reindirizza temporaneamente console.log
const originalConsoleLog = console.log;
console.log = function() {
    // Scrive nel file
    const args = Array.from(arguments);
    const stringArgs = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') + '\n';
    logStream.write(stringArgs);
    
    // Stampa anche nella console originale
    originalConsoleLog.apply(console, arguments);
};

// Esegui nuovamente i test per il file di log
console.log('===== TEST RILEVAMENTO CARATTERI CIRILLICI (LOG FILE) =====');

cyrillicTestStrings.forEach((testString, index) => {
    console.log(`\nTest #${index + 1}: "${testString}"`);
    console.log(`Lunghezza stringa: ${testString.length}`);
    
    // Test per pattern cirillico
    const isCyrillic = /[\u0400-\u04FF]/.test(testString);
    console.log(`Contiene caratteri cirillici: ${isCyrillic}`);
});

console.log('\n===== FINE TEST =====');

// Ripristina console.log
console.log = originalConsoleLog;

console.log(`Output salvato in: ${outputPath}`);
