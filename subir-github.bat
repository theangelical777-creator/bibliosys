@echo off
SET GIT="C:\Program Files\Git\cmd\git.exe"

echo === Configurando Git ===
%GIT% config user.email "serrano@bibliosys.com"
%GIT% config user.name "SERRANO"

echo === Creando Commit ===
%GIT% commit -m "feat: BiblioSys - setup for production PostgreSQL, Vercel and Render"

echo === Configurando rama main ===
%GIT% branch -M main

echo === Conectando con GitHub (ignorando si ya existe el remote) ===
%GIT% remote remove origin 2>nul
%GIT% remote add origin https://github.com/theangelical777-creator/bibliosys.git

echo === Subiendo a GitHub ===
%GIT% push -u origin main

echo.
echo === PROCESO COMPLETADO ===
pause
