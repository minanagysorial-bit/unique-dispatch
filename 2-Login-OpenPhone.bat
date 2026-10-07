@echo off
title OpenPhone Login - Unique Dispatch
echo ====================================================
echo  Opening OpenPhone in Dedicated Session Window...
echo ====================================================
echo Closing any previous locks...
if exist "openphone_session\lockfile" del /f /q "openphone_session\lockfile"
if exist "openphone_session\SingletonLock" del /f /q "openphone_session\SingletonLock"
if exist "openphone_session\SingletonCookie" del /f /q "openphone_session\SingletonCookie"
if exist "openphone_session\SingletonSocket" del /f /q "openphone_session\SingletonSocket"
if exist "openphone_session\Default\LOCK" del /f /q "openphone_session\Default\LOCK"

echo Launching Chrome with saved session profile...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%~dp0openphone_session" --no-first-run --no-default-browser-check --new-window "https://my.openphone.com"
if %ERRORLEVEL% NEQ 0 (
    echo Trying fallback Chrome/Edge...
    start "" chrome.exe --user-data-dir="%~dp0openphone_session" --no-first-run --no-default-browser-check --new-window "https://my.openphone.com"
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --user-data-dir="%~dp0openphone_session" --no-first-run --no-default-browser-check --new-window "https://my.openphone.com"
)
echo.
echo Browser opened! Complete your login in the window and allow microphone permissions.
echo Once logged in, you can close the browser window.
pause
