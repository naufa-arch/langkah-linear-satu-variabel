@echo off
title Membuat APK Langkah Linear
rem Klik dua kali file ini untuk membuat APK. Hasilnya: folder dist\LangkahLinear.apk
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-apk.ps1"
pause
