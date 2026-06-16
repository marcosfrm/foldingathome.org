#!/usr/bin/env bash
# Build and push to the prod host. Run from your dev shell.
#
#   deploy/deploy.sh                       # uses ssh alias 'foldingathome.org'
#   deploy/deploy.sh <ssh-target>
#
# Assumes the remote already has Node installed and deploy/install.sh
# has been run once.

set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TARGET="${1:-foldingathome.org}"
REMOTE_ROOT=/var/www/foldingathome.org

log() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

log "ssh ${TARGET}: smoke test"
ssh -o BatchMode=yes "$TARGET" true \
  || { echo "error: ssh ${TARGET} failed" >&2; exit 1; }

cd "$REPO_ROOT"

log "rsync public/ → ${TARGET}:${REMOTE_ROOT}/public/"
rsync -azJO --delete --info=stats1 --no-o --no-g \
  .output/public/ "${TARGET}:${REMOTE_ROOT}/public/"

log "rsync server/ → ${TARGET}:${REMOTE_ROOT}/server/"
rsync -azJO --delete --info=stats1 --no-o --no-g \
  .output/server/ "${TARGET}:${REMOTE_ROOT}/server/"

log "fix ownership + restart"
ssh "$TARGET" "sudo chown -R www-data:www-data ${REMOTE_ROOT} \
  && sudo systemctl restart foldingathome-web \
  && sudo systemctl status foldingathome-web --no-pager -l | head -5"
