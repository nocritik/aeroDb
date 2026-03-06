@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo  AeroDb - Build Android (Capacitor)
echo ============================================

echo.
echo [1/6] Installation des dependances npm...
call npm install
if errorlevel 1 ( echo ERREUR : npm install a echoue & exit /b 1 )

echo.
echo [2/6] Installation globale de Capacitor CLI...
call npm install -g @capacitor/cli
if errorlevel 1 ( echo ERREUR : installation @capacitor/cli a echoue & exit /b 1 )

echo.
echo [3/6] Initialisation de Capacitor (ignore si deja fait)...
call npx cap init aeroDb com.example.aerodb --web-dir www 2>nul
rem Ne bloque pas si deja initialise

echo.
echo [4/6] Copie des sources dans www/...
call npm run sync-www
if errorlevel 1 ( echo ERREUR : sync-www a echoue & exit /b 1 )

echo.
echo [5/6] Ajout de la plateforme Android (ignore si deja ajoutee)...
call npx cap add android 2>nul
rem Ne bloque pas si android est deja present

echo.
echo [6/6] Synchronisation des plugins Capacitor...
call npx cap sync android
if errorlevel 1 ( echo ERREUR : cap sync android a echoue & exit /b 1 )

echo.
echo ============================================
echo  Build prepare. Ouverture d'Android Studio...
echo  Dans Android Studio : Build ^> Build Bundle(s) / APK(s)
echo ============================================
echo.
call npx cap open android

endlocal
