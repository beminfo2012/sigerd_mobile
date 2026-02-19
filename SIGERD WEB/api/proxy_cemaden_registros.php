<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

// A API do CEMADEN para acumulados espera GET, então o proxy também deve aceitar GET.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método não permitido. Use GET.']);
    exit;
}

// Pega os parâmetros da URL (codibge e token)
$codibge = isset($_GET['codibge']) ? $_GET['codibge'] : '';
$data = isset($_GET['data']) ? $_GET['data'] : '';
$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($codibge) || empty($data) || empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parâmetros codibge, data e token são obrigatórios.']);
    exit;
}

$baseUrl = "https://sws.cemaden.gov.br/PED/rest/pcds-acum/acumulados-historicos";

// Monta a URL com os parâmetros corretos (query string)
$queryParams = http_build_query([
    'codibge' => $codibge,
    'data' => $data
]);
$url = $baseUrl . '?' . $queryParams;

$options = [
    'http' => [
        // A API do CEMADEN espera o token em um cabeçalho 'token'
        'header' => "token: " . $token,
        'method' => 'GET',
        'ignore_errors' => true // Permite capturar respostas de erro da API
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

$status_line = $http_response_header[0];
preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
$status = $match[1];

http_response_code(intval($status));
echo $result;