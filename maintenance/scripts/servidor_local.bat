@echo off
color 0A
echo ==========================================
echo   SIGERD Mobile - Servidor Local v1.2.0
echo ==========================================
echo.
echo Iniciando servidor de desenvolvimento...
echo.
echo O app estara disponivel em:
echo http://localhost:5173
echo.
echo Abra este endereco no navegador do celular
echo (certifique-se de estar na mesma rede Wi-Fi)
echo.
echo Para acessar do celular, use o IP do PC:
ipconfig | findstr /i "IPv4"
echo.
echo Exemplo: http://192.168.1.X:5173
echo.
echo ==========================================
echo Pressione Ctrl+C para parar o servidor
echo ==========================================
echo.

npm run dev -- --host
