<?php
// ping.php - Un endpoint di backup per i test di connessione

// Abilita CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID');

// Gestisci richieste OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Rispondi alla richiesta ping
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'Server is running (PHP fallback)',
    'timestamp' => date('c')
]);
?>