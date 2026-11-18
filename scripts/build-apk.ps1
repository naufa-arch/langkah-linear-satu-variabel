# Membuat file APK Android "Langkah Linear" dengan Capacitor.
# Jalankan dari folder utama proyek:   powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
# Syarat (sekali saja, lihat docs/ANDROID.md): Node.js LTS + Android Studio (sudah termasuk Java & Android SDK).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host ''; Write-Host "==> $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host ''; Write-Host "GAGAL: $msg" -ForegroundColor Red; exit 1 }

Step 'Memeriksa Node.js'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js belum terpasang. Jalankan: winget install OpenJS.NodeJS.LTS  lalu tutup & buka ulang VS Code.' }
node -v

Step 'Memeriksa Java (JDK 21) dan Android SDK'
if (-not $env:JAVA_HOME) {
    $jbr = 'C:\Program Files\Android\Android Studio\jbr'
    if (Test-Path $jbr) { $env:JAVA_HOME = $jbr } else { Fail 'Java tidak ditemukan. Pasang Android Studio (winget install Google.AndroidStudio), buka sekali sampai selesai mengunduh SDK.' }
}
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path $env:ANDROID_HOME)) { Fail "Android SDK tidak ada di $env:ANDROID_HOME. Buka Android Studio sekali (More Actions > SDK Manager) agar SDK terunduh." }
Write-Host "JAVA_HOME=$env:JAVA_HOME"; Write-Host "ANDROID_HOME=$env:ANDROID_HOME"

Step 'Memeriksa alamat server di frontend/src/config.js'
$cfg = Get-Content 'frontend/src/config.js' -Raw
if ($cfg -match "REMOTE_API = '([^']+)'") { Write-Host "APK akan memakai server: $($matches[1])" -ForegroundColor Yellow }

Step 'Memasang paket Capacitor (npm install)'
npm install
if ($LASTEXITCODE) { Fail 'npm install gagal.' }

if (-not (Test-Path 'android')) {
    Step 'Membuat proyek Android (sekali saja)'
    npx cap add android
    if ($LASTEXITCODE) { Fail 'cap add android gagal.' }
}

Step 'Membuat ikon & splash screen dari folder assets/'
npm run android:assets
if ($LASTEXITCODE) { Write-Host 'Peringatan: pembuatan ikon gagal, memakai ikon bawaan.' -ForegroundColor Yellow }

Step 'Menyalin frontend ke proyek Android (cap sync)'
npx cap sync android
if ($LASTEXITCODE) { Fail 'cap sync gagal.' }

"sdk.dir=$($env:ANDROID_HOME -replace '\\','\\')" | Set-Content 'android/local.properties' -Encoding ascii

Step 'Membangun APK (pertama kali bisa 5-15 menit karena mengunduh Gradle)'
Push-Location android
.\gradlew.bat assembleDebug
$code = $LASTEXITCODE
Pop-Location
if ($code) { Fail 'Gradle gagal. Buka folder android di Android Studio untuk melihat detail error.' }

New-Item -ItemType Directory -Force 'dist' | Out-Null
$apk = 'android/app/build/outputs/apk/debug/app-debug.apk'
Copy-Item $apk 'dist/LangkahLinear.apk' -Force
Write-Host ''
Write-Host '================================================' -ForegroundColor Green
Write-Host "  APK SIAP: $root\dist\LangkahLinear.apk" -ForegroundColor Green
Write-Host '  Kirim file ini ke HP (WhatsApp/kabel USB/Drive),' -ForegroundColor Green
Write-Host '  buka, lalu izinkan "Instal dari sumber ini".' -ForegroundColor Green
Write-Host '================================================' -ForegroundColor Green
