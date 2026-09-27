#!/usr/bin/env sh
# Lance le kit (macOS / Linux). Sous Windows : double-clique sur Lancer-Live.bat.
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Installe Node.js (https://nodejs.org) puis relance."; exit 1; }
[ -d node_modules/tiktok-live-connector ] || npm install --no-audit --no-fund
( sleep 1; (command -v open >/dev/null && open http://localhost:7777/) || (command -v xdg-open >/dev/null && xdg-open http://localhost:7777/) ) >/dev/null 2>&1 &
exec node server.js
