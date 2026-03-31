@echo off
color 0A
echo ==========================================
echo      Deploy Manual para Vercel
echo ==========================================
echo.

echo [1/4] Verificando mudancas...
git status

echo.
echo [2/4] Construindo versao de producao...
call npm run build

echo.
echo [3/4] Enviando para GitHub...
git add .
git commit -m "Manual deploy - GeoRescue UC updates" 2>nul
git push origin HEAD:main

echo.
echo [4/4] Aguardando deploy na Vercel...
echo.
echo ==========================================
echo  IMPORTANTE: Acesse https://vercel.com
echo  e verifique se o deploy foi iniciado!
echo ==========================================
echo.
echo Aguarde 2-3 minutos apos o deploy
echo completar na Vercel, depois:
echo 1. Abra o app no celular
echo 2. Va em Menu ^> Resetar Aplicativo
echo 3. Faca login novamente
echo ==========================================
timeout /t 10
