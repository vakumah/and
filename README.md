# Android Web Controller

web interface buat kontrol android emulator dari browser. bisa streaming layar, install apk, manage files, dll.

## setup

```bash
npm install
npm run dev
```

buka http://localhost:3000

## requirements

- nodejs 18+
- adb
- ffmpeg
- android device/emulator

## usage

pastikan device udah connect:
```bash
adb devices
```

kalo mau production:
```bash
npm run build
npm start
```

## features

- screen mirroring real-time
- touch control
- install/uninstall apps
- file manager
- logcat viewer
- adb terminal
- screenshot & recording

## github actions

workflow udah include di `.github/workflows/android.yml`. tinggal run aja nanti dapet cloudflare url buat akses dari mana aja.

## tech

frontend: vanilla js, css, websocket, canvas
backend: nodejs, express, adbkit, ffmpeg

## license

MIT
