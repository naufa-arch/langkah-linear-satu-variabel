# Menyalakan Langkah Linear + link HTTPS publik (Cloudflare Tunnel, tanpa akun).
# Dipanggil oleh "Jalankan Langkah Linear.bat". Tutup jendelanya untuk mematikan semuanya.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root 'backend'
$port = 8000
$log = Join-Path $env:TEMP 'langkah-linear-tunnel.log'
$procs = @()

function Find-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\cloudflared.exe",
        "$env:ProgramFiles\cloudflared\cloudflared.exe",
        "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    $found = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter cloudflared*.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Test-Server {
    try { (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$port/api/v1/health" -TimeoutSec 2).StatusCode -eq 200 } catch { $false }
}

try {
    Write-Host ''
    Write-Host '  Menyalakan Langkah Linear...' -ForegroundColor Cyan
    if (-not (Test-Server)) {
        # -NoNewWindow: proses memakai jendela ini, jadi ikut mati saat jendela ditutup
        $procs += Start-Process -FilePath 'uv' -ArgumentList 'run', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', "$port" `
            -WorkingDirectory $backend -NoNewWindow -PassThru `
            -RedirectStandardOutput (Join-Path $env:TEMP 'langkah-linear-server.out.log') `
            -RedirectStandardError (Join-Path $env:TEMP 'langkah-linear-server.err.log')
        for ($i = 0; $i -lt 60 -and -not (Test-Server); $i++) { Start-Sleep -Milliseconds 500 }
    }
    if (-not (Test-Server)) { throw 'Server tidak mau menyala. Coba jalankan "uv sync" di folder backend.' }

    $url = $null
    $cf = Find-Cloudflared
    if ($cf) {
        Write-Host '  Membuat link HTTPS (sekitar 5-15 detik)...' -ForegroundColor Cyan
        if (Test-Path $log) { Remove-Item $log -Force }
        $procs += Start-Process -FilePath $cf -ArgumentList 'tunnel', '--no-autoupdate', '--url', "http://127.0.0.1:$port" `
            -RedirectStandardError $log -RedirectStandardOutput (Join-Path $env:TEMP 'langkah-linear-tunnel.out.log') -NoNewWindow -PassThru
        for ($i = 0; $i -lt 60 -and -not $url; $i++) {
            Start-Sleep -Milliseconds 500
            if (Test-Path $log) {
                $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($m) { $url = $m.Matches[0].Value }
            }
        }
    }

    if (-not $url) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Loopback' } | Select-Object -First 1).IPAddress
        $url = "http://${ip}:$port"
        Write-Host ''
        if ($cf) { Write-Host '  Link HTTPS gagal dibuat (cek internet). Memakai link Wi-Fi.' -ForegroundColor Yellow }
        else { Write-Host '  cloudflared belum terpasang, jadi memakai link Wi-Fi (HP harus di Wi-Fi yang sama).' -ForegroundColor Yellow }
    }

    Set-Clipboard -Value $url
    Write-Host ''
    Write-Host '  ==================================================' -ForegroundColor Green
    Write-Host '    Buka link ini di laptop DAN di HP:' -ForegroundColor Green
    Write-Host ''
    Write-Host "      $url" -ForegroundColor White
    Write-Host ''
    Write-Host '    Link sudah DISALIN. Tempel (Ctrl+V) ke WhatsApp,' -ForegroundColor Green
    Write-Host '    lalu klik link itu dari HP.' -ForegroundColor Green
    Write-Host ''
    Write-Host '    Biarkan jendela ini terbuka. Tutup untuk mematikan.' -ForegroundColor Green
    Write-Host '  ==================================================' -ForegroundColor Green
    Start-Process $url
    if ($procs.Count) { Wait-Process -Id ($procs | ForEach-Object Id) } else { Read-Host '  Tekan Enter untuk keluar' }
}
catch {
    Write-Host ''
    Write-Host "  Gagal: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host '  Tekan Enter untuk keluar'
}
finally {
    foreach ($p in $procs) { if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }
}
