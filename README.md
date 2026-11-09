# Afterglow Arcade
A Windows desktop game collection source project and separate informational website.
## Desktop
Node.js 20+. Run `npm install`, then `npm start`. To build the Windows NSIS installer, run `npm run dist` on Windows. The config creates desktop/start-menu shortcuts and supports uninstall through NSIS.
## Website
Open `website/index.html` or deploy the `website` folder as a static site. It is informational only; it contains no gameplay. The download button is intentionally disabled until a real installer is published. The game app and public site are separate products.
## Implemented
Six mini-games run inside Electron. Best scores and history use localStorage. Gamer Percentage is only available after each of the six has a score and is the rounded mean of the six best scores. Replay creates a new round; history is kept separately.
## Setup still required for public release
No installer binary, deployment, signing certificate, GitHub release, or authentication backend is included. Configure Supabase or Firebase consistently for website and app before advertising account creation, password recovery, verification, or sync. The current app profile prompt is a local player label, not authentication, and no passwords are collected.
Contexto uses a small curated offline semantic neighborhood list, not a general semantic similarity model. Head Count is currently a timed visual face-count challenge. The linked Squareheads video could not be fetched to confirm exact rules, so this game is not claimed to match the reference.
