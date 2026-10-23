@echo off
title Sistema Control de Acceso - Recuperaciones Naranjo (Cartagena)
color 0E

echo ===============================================================================
echo     RECUPERACIONES NARANJO RECYCLING S.A.S. - CARTAGENA DE INDIAS
echo     Sistema Integral de Control de Acceso, Asistencia 42h y Cuadrillas
echo ===============================================================================
echo.
echo Iniciando servidor en puerto 3460...
set PORT=3460
start http://localhost:3460
node server/server.js
pause
