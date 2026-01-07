@echo off
color 0A
echo ==========================================
echo      Sincronizando com GitHub/Vercel
echo ==========================================
echo.

echo [1/3] Adicionando arquivos...
git add .

echo [2/3] Salvando alteracoes...
set /p msg="Digite a mensagem do commit (ou Enter para 'Atualizacao automatica'): "
if "%msg%"=="" set msg=Atualizacao automatica
git commit -m "%msg%"

echo [3/3] Sincronizando e enviando para o servidor...
git push origin HEAD:main

echo.
echo ==========================================
echo      SUCESSO! Deploy iniciado na Vercel
echo ==========================================
timeout /t 5
