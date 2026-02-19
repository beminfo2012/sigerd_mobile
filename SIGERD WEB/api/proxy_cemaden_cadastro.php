<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Pega os parâmetros da URL (codibge e token)
$codibge = isset($_GET['codibge']) ? $_GET['codibge'] : '';
$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($codibge) || empty($token)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parâmetros codibge e token são obrigatórios.']);
    exit;
}

// A URL base da API
$baseUrl = "https://sws.cemaden.gov.br/PED/rest/pcds-cadastro/dados-cadastrais";

// Monta a URL com os parâmetros corretos (query string)
$queryParams = http_build_query([
    'codibge' => $codibge
]);
$url = $baseUrl . '?' . $queryParams;

$options = [
    'http' => [
        // A API do CEMADEN espera o token em um cabeçalho 'token', não 'Authorization'
        'header' => "token: " . $token,
        'method' => 'GET',
        'ignore_errors' => true // Permite capturar respostas de erro da API
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

// Extrai o código de status da resposta
$status_line = $http_response_header[0];
preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
$status = $match[1];

http_response_code(intval($status));
echo $result;