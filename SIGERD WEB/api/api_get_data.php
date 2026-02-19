<?php
// Define o cabeçalho da resposta como JSON e desativa o cache
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
header('Pragma: no-cache'); // HTTP 1.0.
header('Expires: 0'); // Proxies.

$mainDataPath = __DIR__ . '/data.json';
$fideDataPath = __DIR__ . '/fide_data.json';
$conversationsPath = __DIR__ . '/conversations.json';

// Inicializa os dados
$allData = [];

if (file_exists($mainDataPath)) {
    $allData = json_decode(file_get_contents($mainDataPath), true);
    if (is_null($allData)) $allData = []; // Garante que é um array se o JSON estiver vazio/inválido
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Arquivo de dados principal (data.json) não encontrado.']);
    exit;
}

// Carrega dados do FIDE
if (file_exists($fideDataPath)) {
    $allData['fideData'] = json_decode(file_get_contents($fideDataPath), true);
} else {
    $allData['fideData'] = []; // Se não existir, retorna um array vazio
}

// Carrega dados das conversas
if (file_exists($conversationsPath)) {
    $allData['conversations'] = json_decode(file_get_contents($conversationsPath), true);
} else {
    $allData['conversations'] = []; // Se não existir, retorna um array vazio
}

echo json_encode($allData);