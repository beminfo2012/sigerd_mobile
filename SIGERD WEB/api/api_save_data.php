<?php
// Define o cabeçalho da resposta como JSON
header('Content-Type: application/json');

// Permite apenas requisições do tipo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['message' => 'Método não permitido.']);
    exit;
}

$mainDataPath = __DIR__ . '/data.json';
$fideDataPath = __DIR__ . '/fide_data.json';
$conversationsDataPath = __DIR__ . '/conversations.json';

// Pega o corpo da requisição (que é JSON)
$input_data = json_decode(file_get_contents('php://input'), true);

if (is_null($input_data)) {
    http_response_code(400); // Bad Request
    echo json_encode(['message' => 'Dados JSON inválidos.']);
    exit;
}

// Separa os dados do FIDE dos outros dados
$fide_data = isset($input_data['fideData']) ? $input_data['fideData'] : [];
$conversations_data = isset($input_data['conversations']) ? $input_data['conversations'] : [];

unset($input_data['fideData']); // Remove os dados do FIDE do array principal
unset($input_data['conversations']); // Remove os dados de conversas do array principal

// Converte os arrays de volta para JSON
$main_json_data = json_encode($input_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$fide_json_data = json_encode($fide_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$conversations_json_data = json_encode($conversations_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

// Tenta escrever os dados no arquivo data.json
if (
    file_put_contents($mainDataPath, $main_json_data) !== false &&
    file_put_contents($fideDataPath, $fide_json_data) !== false &&
    file_put_contents($conversationsDataPath, $conversations_json_data) !== false
) {
    echo json_encode(['message' => 'Dados salvos com sucesso!']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao salvar um ou mais arquivos de dados no servidor.']);
}