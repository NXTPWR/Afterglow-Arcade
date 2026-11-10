# Afterglow Arcade Club

A six-game Windows desktop arcade with a separate informational website.

## Download

Get the Windows 10/11 x64 installer from the [latest GitHub Release](https://github.com/NXTPWR/Afterglow-Arcade/releases/latest/download/Afterglow-Arcade-Club-Setup.exe). The v1.1.0 installer is about 82 MB. It is unsigned, so Windows may show a SmartScreen warning.

## Games and saves

The desktop app includes Perfect Circle, Krillion: The Daily Dive, Perceptle, Head Count, Draw Logos From Memory, and Contexto. Best scores and round history are stored locally on the device. Gamer Percentage appears after all six games have a score and averages each game’s best result.

Email/password sign-in, sign-up, and password reset use Firebase Authentication. Signed-in progress syncs best scores and recent rounds to Firestore under owner-only security rules. Guest progress stays local. Firebase web SDK libraries load from Google’s CDN so no extra runtime package is stored in the installer.

## Build

Requires Node.js 20+. Run `npm ci`, `npm start`, or `npm run dist` on Windows to create the installer. The GitHub Actions Windows workflow tests all six game flows and local-save persistence, builds the installer, silently installs it, checks its desktop shortcut, and launches the installed app.

## Website

Open `website/index.html` or visit [Afterglow Arcade Club](https://nxtpwr.github.io/Afterglow-Arcade/). It introduces the app; gameplay happens in the desktop application.

Contexto uses a small curated offline semantic neighborhood list, not a general language model. Head Count is a timed visual face-count challenge.
