#!/usr/bin/env bash
#
# Android release keystore generate karta hai (sirf ek baar).
# Ye file kabhi git mein commit na karo aur password manager mein backup rakho —
# keystore kho gaya to Play Store par app update nahi ho payega.
#
# Usage:
#   ANDROID_KEYSTORE_PASSWORD='...' ANDROID_KEY_PASSWORD='...' ./scripts/create-keystore.sh
#
# CI secret banane ke liye:
#   base64 -i foodiehub-release.jks | pbcopy
#
set -euo pipefail

KEYSTORE="${ANDROID_KEYSTORE_PATH:-foodiehub-release.jks}"
ALIAS="${ANDROID_KEY_ALIAS:-foodiehub}"
STORE_PASS="${ANDROID_KEYSTORE_PASSWORD:-}"
KEY_PASS="${ANDROID_KEY_PASSWORD:-$STORE_PASS}"

if [[ -z "$STORE_PASS" ]]; then
  echo "✗ ANDROID_KEYSTORE_PASSWORD set karo (kam se kam 6 characters)." >&2
  exit 1
fi

if [[ -f "$KEYSTORE" ]]; then
  echo "✓ $KEYSTORE pehle se hai — overwrite nahi kar rahe."
  exit 0
fi

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Foodie Hub, OU=Mobile, O=Foodie Hub, L=Delhi, ST=Delhi, C=IN"

echo
echo "✓ Keystore ready: $KEYSTORE (alias: $ALIAS)"
echo "  SHA-256 fingerprint (deep links ke liye):"
keytool -list -v -keystore "$KEYSTORE" -storepass "$STORE_PASS" -alias "$ALIAS" \
  | grep -i "SHA256:" || true
echo
echo "  CI secret: base64 -i \"$KEYSTORE\" | pbcopy"
echo "  Local build:"
echo "    export ANDROID_KEYSTORE_PATH=\"$(pwd)/$KEYSTORE\""
echo "    export ANDROID_KEYSTORE_PASSWORD='...' ANDROID_KEY_ALIAS='$ALIAS' ANDROID_KEY_PASSWORD='...'"
echo "    npm run app:android"
