// Alamat server (backend FastAPI).
// - Dibuka dari server sendiri (laptop / Render): API ada di alamat yang sama, tidak perlu diatur.
// - Aplikasi Android (APK) & GitHub Pages: memakai REMOTE_API di bawah.
//   Ganti dengan link Render Anda setelah deploy (lihat docs/DEPLOY.md), lalu build ulang APK.
// - Bisa juga diganti dari aplikasi: Profil → Pengaturan lanjutan → Alamat server.
export const REMOTE_API = 'https://langkah-linear.onrender.com';

export const APP_VERSION = '1.0.0';

export const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
