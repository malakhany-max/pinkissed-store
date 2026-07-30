@echo off
start /B /MIN node server.js
timeout /t 3 /nobreak >nul
start /B /MIN npx localtunnel --port 3000 --subdomain pinkissed-api
echo Pinkissed server + tunnel started!
echo Server: http://localhost:3000
echo Tunnel: https://pinkissed-api.loca.lt
pause
