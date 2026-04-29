#!/bin/sh
set -eu

: "${API_BASE_URL:=}"

cat >/usr/share/nginx/html/config.js <<EOF
window.__WORMIE_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}"
};
EOF
