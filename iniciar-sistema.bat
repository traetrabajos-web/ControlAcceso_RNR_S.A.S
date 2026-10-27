@echo off
title Sistema Control de Acceso - Recuperaciones Naranjo (Cartagena)
color 0E

echo ===============================================================================
echo     RECUPERACIONES NARANJO RECYCLING S.A.S. - CARTAGENA DE INDIAS
echo     Sistema Integral de Control de Acceso, Asistencia 42h y Cuadrillas
echo ===============================================================================
echo.

:: Verificar si MySQL est activo en el puerto 3306
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [MySQL] Iniciando base de datos MySQL (sentinelpro_iam)...
    if exist "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe" (
        start /b "" "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe" --defaults-file="C:\laragon\bin\mysql\mysql-8.4.3-winx64\my.ini"
        timeout /t 3 /nobreak >nul
    )
)

echo [OK] MySQL verificado en puerto 3306.
echo Iniciando servidor Node.js en puerto 3460...
set PORT=3460
timeout /t 1 /nobreak >nul
start http://localhost:3460
node server/server.js
pause
