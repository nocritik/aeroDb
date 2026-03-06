@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  AeroDb - Build Desktop (Electron / Windows)
echo ============================================

echo.
echo [1/2] Installation des dependances npm...
call npm install
if errorlevel 1 ( echo ERREUR : npm install a echoue & exit /b 1 )

echo.
echo [2/2] Generation de l'executable Windows (NSIS)...
call npm run dist-win
if errorlevel 1 ( echo ERREUR : dist-win a echoue & exit /b 1 )

echo.
echo ============================================
echo  Build termine. Executable dans dist/
echo ============================================

endlocal
