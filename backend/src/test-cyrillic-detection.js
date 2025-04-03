// Test di rilevamento caratteri cirillici
console.log('===== TEST RILEVAMENTO CARATTERI CIRILLICI =====');

// Importa il rilevatore di lingua
const LanguageDetector = require('./services/mistral/LanguageDetector');

// Crea un'istanza del rilevatore
const detector = new LanguageDetector();

// Stringhe di test
const testStrings = [
    "ПРИВЕТ",                  // Maiuscolo
    "Привет",                  // Minuscolo con prima lettera maiuscola
    "привет",                  // Tutto minuscolo
    "ПРВЕТ",                   // Variante senza una lettera
    "Hello",                   // Inglese
    "Ciao",                    // Italiano
    "你好",                     // Cinese
    "こんにちは",               // Giapponese
    "ПРИВЕТ Hello",            // Misto russo-inglese
    "Hello ПРИВЕТ",            // Misto inglese-russo
    "\u041f\u0420\u0418\u0412\u0415\u0422" // ПРИВЕТ in escape Unicode
];

// Esegui i test
testStrings.forEach((str, index) => {
    console.log(`\n[Test ${index+1}] Stringa: "${str}" (${str.length} caratteri)`);
    
    // Analisi caratteri
    console.log('  Analisi caratteri:');
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = char.charCodeAt(0);
        const isInCyrillicRange = code >= 0x0400 && code <= 0x04FF;
        console.log(`   - Carattere ${i+1}: '${char}' (Unicode: ${code}, Hex: 0x${code.toString(16)}, Cirillico: ${isInCyrillicRange})`);
    }
    
    // Test con espressione regolare
    const hasCyrillic = /[\u0400-\u04FF]/.test(str);
    console.log(`  Contiene caratteri cirillici (regex): ${hasCyrillic}`);
    
    // Rilevamento lingua
    const detected = detector.detect(str);
    console.log(`  Lingua rilevata: ${detected}`);
});

console.log('\n===== FINE TEST =====');
