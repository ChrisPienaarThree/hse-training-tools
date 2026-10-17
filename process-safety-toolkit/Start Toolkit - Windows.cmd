@echo off
rem Opens the Process Safety Analysis Toolkit in Microsoft Edge (or the default browser)
start "" msedge "%~dp0START HERE.html"
if errorlevel 1 start "" "%~dp0START HERE.html"
