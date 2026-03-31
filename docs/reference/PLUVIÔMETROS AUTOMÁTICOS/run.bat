@echo off
echo Atualizando dados dos pluviometros...
node fetch_data.js
if %errorlevel% neq 0 (
    echo Erro ao buscar dados.
    pause
    exit /b %errorlevel%
)

echo Gerando arte...
node generate_image.js
if %errorlevel% neq 0 (
    echo Erro ao gerar imagem.
    pause
    exit /b %errorlevel%
)

echo Sucesso! A imagem 'pluviometros_art.png' foi atualizada.
echo.
pause
