#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

PACKAGE="/home/harjasmeet/ekd-pwa-20261002_staging_princy_ui_2561d1b.tar.gz"
EXPECTED_PACKAGE_SHA="11c66f4f01eb5ca0f025a59c3001e547b7eb957e4527187865a6d6ce08db1c0c"
EXPECTED_INDEX_SHA="be4966da604297d35fdb30a40ec24c81b843b026bf530fb77b4b297594fff622"
RELEASE_DIR="/srv/ekd/pwa/releases/20261002_staging_princy_ui_2561d1b"
CURRENT_LINK="/srv/ekd/pwa/current"
PWA_URL="https://staging.melato.net.in/"
API_URL="https://api-staging.melato.net.in/"
STAMP="$(date +%Y%m%d_%H%M%S)"
ROLLBACK_UNIT="ekd-staging-pwa-princy-ui-rollback-${STAMP}"
ROLLBACK_SCRIPT="/root/${ROLLBACK_UNIT}.sh"
CANCEL_SCRIPT="/root/cancel-${ROLLBACK_UNIT}.sh"
RELEASE_CREATED=0
ACTIVATED=0

rollback_on_error() {
  local status="$?"
  trap - ERR

  if [[ "$ACTIVATED" -eq 1 ]]; then
    echo "ERROR: staging verification failed; restoring $PREVIOUS_RELEASE" >&2
    "$ROLLBACK_SCRIPT" || true
    systemctl stop "${ROLLBACK_UNIT}.timer" 2>/dev/null || true
    systemctl reset-failed "${ROLLBACK_UNIT}.timer" "${ROLLBACK_UNIT}.service" 2>/dev/null || true
  elif [[ "$RELEASE_CREATED" -eq 1 ]]; then
    rm -rf "$RELEASE_DIR"
  fi

  exit "$status"
}

trap rollback_on_error ERR

echo "===== VERIFY PACKAGE ====="
test -f "$PACKAGE"
printf '%s  %s\n' "$EXPECTED_PACKAGE_SHA" "$PACKAGE" | sha256sum --check --strict

echo "===== CURRENT RELEASE ====="
PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK")"
test -d "$PREVIOUS_RELEASE"
printf '%s\n' "$PREVIOUS_RELEASE"

echo "===== INSTALL RELEASE ====="
test ! -e "$RELEASE_DIR"
install -d -o ekd_mandiapi -g ekd_apps -m 775 "$RELEASE_DIR"
RELEASE_CREATED=1
tar --no-same-owner --no-same-permissions -xzf "$PACKAGE" -C "$RELEASE_DIR"
chown -R ekd_mandiapi:ekd_apps "$RELEASE_DIR"
find "$RELEASE_DIR" -type d -exec chmod 775 {} +
find "$RELEASE_DIR" -type f -exec chmod 664 {} +
test -s "$RELEASE_DIR/index.html"
test -s "$RELEASE_DIR/assets/images/product-placeholder.png"
test -s "$RELEASE_DIR/assets/images/category-placeholder.png"
echo "$EXPECTED_INDEX_SHA  $RELEASE_DIR/index.html" | sha256sum --check --strict

if ! grep -q 'api-staging\.melato\.net\.in' "$RELEASE_DIR"/*.js; then
  echo "Staging API endpoint is missing from the package." >&2
  exit 1
fi

if grep -q 'https://api\.melato\.net\.in' "$RELEASE_DIR"/*.js; then
  echo "Production API endpoint found in the staging package." >&2
  exit 1
fi

if grep -q 'ion-palette-dark' "$RELEASE_DIR"/styles-*.css; then
  echo "Active Ionic dark palette found in the package." >&2
  exit 1
fi

echo "===== PREPARE 60-MINUTE ROLLBACK ====="
cat > "$ROLLBACK_SCRIPT" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
NEW_LINK="/srv/ekd/pwa/.rollback-current-${STAMP}"
ln -s "$PREVIOUS_RELEASE" "\$NEW_LINK"
mv -Tf "\$NEW_LINK" "$CURRENT_LINK"
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx.service
echo "Staging PWA rolled back to $PREVIOUS_RELEASE"
EOF
chmod 700 "$ROLLBACK_SCRIPT"

cat > "$CANCEL_SCRIPT" <<EOF
#!/usr/bin/env bash
set -u
/usr/bin/systemctl stop "${ROLLBACK_UNIT}.timer" 2>/dev/null || true
/usr/bin/systemctl reset-failed "${ROLLBACK_UNIT}.timer" "${ROLLBACK_UNIT}.service" 2>/dev/null || true
echo "Staging PWA 2561d1b retained"
EOF
chmod 700 "$CANCEL_SCRIPT"

systemd-run \
  --unit="$ROLLBACK_UNIT" \
  --on-active=60m \
  "$ROLLBACK_SCRIPT"

echo "===== ACTIVATE RELEASE ====="
NEW_LINK="/srv/ekd/pwa/.current-${STAMP}"
ln -s "$RELEASE_DIR" "$NEW_LINK"
mv -Tf "$NEW_LINK" "$CURRENT_LINK"
ACTIVATED=1
nginx -t
systemctl reload nginx.service

echo "===== VERIFY ====="
test "$(readlink -f "$CURRENT_LINK")" = "$RELEASE_DIR"
systemctl is-active --quiet nginx.service
systemctl is-active --quiet ekd-mandi.service
systemctl is-active --quiet ekd-email.service
systemctl is-active --quiet ekd-transport-realtime.service
systemctl is-active --quiet ekd-staging-evidence-storage.service
curl --fail --silent --show-error "$API_URL"
echo
PUBLIC_INDEX_SHA="$(curl --fail --silent --show-error -H 'Cache-Control: no-cache' "${PWA_URL}?release=${STAMP}" | sha256sum | awk '{print $1}')"
printf 'target_index_sha=%s\n' "$EXPECTED_INDEX_SHA"
printf 'public_index_sha=%s\n' "$PUBLIC_INDEX_SHA"
test "$PUBLIC_INDEX_SHA" = "$EXPECTED_INDEX_SHA"

echo "===== ROLLBACK TIMER ====="
systemctl list-timers --all | grep "$ROLLBACK_UNIT"
echo "Functional test staging now. After it passes, run:"
echo "$CANCEL_SCRIPT"
echo "For an immediate manual rollback, run:"
echo "$ROLLBACK_SCRIPT"
trap - ERR
