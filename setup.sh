#!/bin/sh
# Verifica gli strumenti elencati in requisiti.txt e installa quelli mancanti.
# Uso: ./setup.sh          verifica e installa
#      ./setup.sh --check  verifica soltanto
set -u
cd "$(dirname "$0")"
CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1

if command -v brew >/dev/null 2>&1; then PM=brew
elif command -v apt-get >/dev/null 2>&1; then PM=apt
else PM=none; fi

missing=0
while read -r cmd brew_pkg apt_pkg <&3; do
  case "$cmd" in ''|\#*) continue;; esac
  if command -v "$cmd" >/dev/null 2>&1; then echo "ok        $cmd"; continue; fi
  if [ "$CHECK" = 1 ]; then echo "MANCA     $cmd"; missing=1; continue; fi
  echo "installo  $cmd"
  case "$PM" in
    brew) brew install "$brew_pkg" ;;
    apt)  sudo apt-get install -y "$apt_pkg" ;;
    *)    echo "          nessun gestore di pacchetti trovato: installa $cmd a mano" ;;
  esac
  command -v "$cmd" >/dev/null 2>&1 || { echo "MANCA     $cmd"; missing=1; }
done 3< requisiti.txt

if command -v node >/dev/null 2>&1; then
  node -e 'process.exit(+process.versions.node.split(".")[0]>=20?0:1)' \
    || { echo "VECCHIO   node $(node -v): serve la versione 20 o successiva"; missing=1; }
fi

if [ "$CHECK" = 0 ] && [ ! -d .git ] && command -v git >/dev/null 2>&1; then
  git init -q -b main && echo "creato    repository git (ramo main)"
fi

echo
if [ "$missing" = 0 ]; then
  echo "Tutto pronto. Per provare l'app: npx serve .  (poi apri l'indirizzo indicato)"
  echo "La CLI di Supabase si usa senza installarla: npx supabase <comando>"
else
  echo "Mancano alcuni strumenti: vedi le righe MANCA o VECCHIO qui sopra."
  exit 1
fi
