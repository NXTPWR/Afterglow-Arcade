# Afterglow Arcade Club

A six-game Windows desktop arcade with a separate informational website.

## Download

Get the Windows 10/11 x64 installer from the [latest GitHub Release](https://github.com/NXTPWR/Afterglow-Arcade/releases/latest/download/Afterglow-Arcade-Club-Setup.exe). The v1.0.0 installer is about 82 MB. It is unsigned, so Windows may show a SmartScreen warning.

## Games and saves

The desktop app includes Perfect Circle, Krillion: The Daily Dive, Perceptle, Head Count, Draw Logos From Memory, and Contexto. Best scores and round history are stored locally on the device. Gamer Percentage appears after all six games have a score and averages each game’s best result.

The account button currently sets a local display name only. Online sign-in, sign-up, password recovery, and cloud sync are not configured; the app does not collect passwords.

## Build

Requires Node.js 20+. Run `npm ci`, `npm start`, or `npm run dist` on Windows to create the installer. The GitHub Actions Windows workflow tests all six game flows and local-save persistence, builds the installer, silently installs it, checks its desktop shortcut, and launches the installed app.

## Website

Open `website/index.html` or visit [Afterglow Arcade Club](https://nxtpwr.github.io/Afterglow-Arcade/). It introduces the app; gameplay happens in the desktop application.

Contexto uses a small curated offline semantic neighborhood list, not a general language model. Head Count is a timed visual face-count challenge.
