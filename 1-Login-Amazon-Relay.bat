@echo off
title Amazon Relay 2FA Login - Unique Dispatch
echo ====================================================
echo  Opening Amazon Relay in Dedicated Session Window...
echo ====================================================
echo Closing any previous locks...
if exist "relay_session\lockfile" del /f /q "relay_session\lockfile"
if exist "relay_session\SingletonLock" del /f /q "relay_session\SingletonLock"
if exist "relay_session\SingletonCookie" del /f /q "relay_session\SingletonCookie"
if exist "relay_session\SingletonSocket" del /f /q "relay_session\SingletonSocket"
if exist "relay_session\Default\LOCK" del /f /q "relay_session\Default\LOCK"

echo Launching Chrome with saved session profile...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%~dp0relay_session" --no-first-run --no-default-browser-check --new-window "https://relay.amazon.com/tours/in-transit"
if %ERRORLEVEL% NEQ 0 (
    echo Trying fallback Chrome/Edge...
    start "" chrome.exe --user-data-dir="%~dp0relay_session" --no-first-run --no-default-browser-check --new-window "https://relay.amazon.com/tours/in-transit"
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --user-data-dir="%~dp0relay_session" --no-first-run --no-default-browser-check --new-window "https://relay.amazon.com/tours/in-transit"
)
echo.
echo Browser opened! Complete your login and 2FA in the window.
echo Once logged in, you can close the browser window.
pause
