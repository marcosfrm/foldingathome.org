#!/usr/bin/env bash
# One-time prod install. Run on the web host as root.
#
#   sudo deploy/install.sh
#
# Creates the app dir, installs the systemd unit, enables it. Idempotent.

set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "must be run as root" >&2; exit 1; fi
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# /var/www/foldingathome.org/  ← app root
#                  ├── public/  ← prerendered HTML + hashed assets
#                  └── server/  ← Nuxt SSR Node app (index.mjs + chunks)
install -d -m 0775 -o www-data -g www-data /var/www/foldingathome.org
install -d -m 0775 -o www-data -g www-data /var/www/foldingathome.org/public
install -d -m 0775 -o www-data -g www-data /var/www/foldingathome.org/server

# Optional env-override file. Empty by default; the unit's hard-coded
# Environment= lines win unless this file overrides them.
install -d -m 0755 /etc/foldingathome.org
[[ -f /etc/foldingathome.org/web.env ]] || \
  install -m 0640 -o root -g www-data /dev/null /etc/foldingathome.org/web.env

install -m 0644 "$SCRIPT_DIR/foldingathome-web.service" \
  /etc/systemd/system/foldingathome-web.service

systemctl daemon-reload
systemctl enable foldingathome-web

echo
echo "Installed. Push a build with deploy/deploy.sh, then:"
echo "    sudo systemctl start foldingathome-web"
echo "    journalctl -u foldingathome-web -f"
