<?php
// chat-proxy.php - Un proxy che inoltrerà le richieste al backend Node.js
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID');

// Gestisci richieste OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ottieni il percorso richiesto o usa il default
$path = isset($_GET['path']) ? $_GET['path'] : 'chat/message';

// Assicurati che il path abbia il prefisso /api/
if (strpos($path, 'api/') !== 0 && strpos($path, '/api/') !== 0) {
    $path = 'api/' . $path;
}

// Rimuovi eventuali slash iniziali doppi
$path = ltrim($path, '/');

$method = $_SERVER['REQUEST_METHOD'];
$payload = file_get_contents('php://input');

// Configura l'URL del backend - per prima prova con localhost:3001, poi con altre opzioni
$backendUrls = [
    'http://localhost:3001/',
    'http://backend:3001/',
    'http://127.0.0.1:3001/',
    './' // relativo, nel caso il backend sia sullo stesso server
];

$response = null;
$httpCode = 0;
$successUrl = null;

// Prova ogni URL fino a quando non ottieni una risposta
foreach ($backendUrls as $baseUrl) {
    $backendUrl = $baseUrl . $path;
    
    // Inizializza cURL
    $ch = curl_init($backendUrl);
    
    // Imposta le opzioni cURL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3); // timeout breve di 3 secondi
    
    if ($method === 'POST' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    
    // Esegui la richiesta
    $result = curl_exec($ch);
    $currentHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Se abbiamo ottenuto una risposta valida (diversa da 0)
    if ($currentHttpCode > 0 && $result !== false) {
        $response = $result;
        $httpCode = $currentHttpCode;
        $successUrl = $backendUrl;
        break;
    }
}

// Se non abbiamo ottenuto risposta da nessun URL, restituisci un errore
if ($httpCode === 0 || $response === null) {
    http_response_code(503); // Service Unavailable
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Comunicazione con il backend fallita',
        'fallback' => true,
        'message' => 'Il servizio è temporaneamente non disponibile. Riprova più tardi.'
    ]);
    exit();
}

// Log della richiesta riuscita
error_log("Proxy riuscito: $method $path -> $successUrl (HTTP $httpCode)");

// Restituisci la risposta con il codice HTTP originale
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
?>