@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SJ Portal
call npm run serve
