@echo off
chcp 65001 >nul
title Compilador de APK - Mente Activa (Ionic / Capacitor)

echo =======================================================
echo          COMPILADOR DE APK - MENTE ACTIVA
echo =======================================================
echo.

:: 1. Ubicar la carpeta del frontend
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%frontend\package.json" (
    set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
) else if exist "%SCRIPT_DIR%package.json" (
    set "FRONTEND_DIR=%SCRIPT_DIR%"
) else (
    echo [ERROR] No se encontro la carpeta frontend.
    goto :error
)

cd /d "%FRONTEND_DIR%"
echo [+] Directorio de trabajo: %FRONTEND_DIR%

:: 2. Configurar JAVA_HOME si no existe o validar Android Studio JBR
if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Android\Android Studio\jbr" (
        set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
    )
)
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERROR] No se encontro Java JDK en "%JAVA_HOME%".
    echo Por favor asegurate de tener Android Studio instalado.
    goto :error
)
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [+] Usando Java: %JAVA_HOME%

:: 3. Verificar advertencia sobre capacitor.config.ts (server.url)
findstr /C:"url:" capacitor.config.ts | findstr /V /C:"//" >nul
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ----------------------------------------------------------------------
    echo [AVISO] Se detecto "server.url" activo en capacitor.config.ts:
    echo        El APK cargara la app web desde el servidor Vite en red local.
    echo        (Para un APK 100%% autonomo/offline para testers, comenta esa linea)
    echo ----------------------------------------------------------------------
    echo.
)

:: 4. Compilar aplicacion web (Vite + TypeScript)
echo =======================================================
echo [PASO 1/3] Compilando frontend web (npm run build)...
echo =======================================================
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo 'npm run build'. Revisa los errores de TypeScript/Vite.
    goto :error
)
echo.

:: 5. Sincronizar assets con Capacitor Android
echo =======================================================
echo [PASO 2/3] Sincronizando con Android (npx cap sync android)...
echo =======================================================
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo 'npx cap sync android'.
    goto :error
)
echo.

:: 6. Compilar APK con Gradle
echo =======================================================
echo [PASO 3/3] Compilando APK Debug con Gradle...
echo =======================================================
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la compilacion de Gradle.
    cd ..
    goto :error
)
cd ..

:: 7. Exito y mostrar ubicacion
set "APK_PATH=%FRONTEND_DIR%\android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo.
    echo =======================================================
    echo   ?COMPILACION EXITOSA!
    echo =======================================================
    echo APK generado en:
    echo "%APK_PATH%"
    echo.
    
    set /p OPEN_EXPLORER="Deseas abrir la carpeta del APK en el Explorador de Windows? (S/N) [S]: "
    if /i "%OPEN_EXPLORER%"=="" set OPEN_EXPLORER=S
    if /i "%OPEN_EXPLORER%"=="S" (
        explorer.exe /select,"%APK_PATH%"
    )
    goto :end
) else (
    echo [ERROR] No se encontro el APK generado en la ruta esperada.
    goto :error
)

:error
echo.
echo =======================================================
echo   HUBO UN ERROR DURANTE LA COMPILACION
echo =======================================================
pause
exit /b 1

:end
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
exit /b 0
