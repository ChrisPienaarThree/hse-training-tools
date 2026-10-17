@echo off
cd /d "%~dp0"
start "" msedge "%~dp0Hazard Register.html" 2>nul || start "" "%~dp0Hazard Register.html"
