#!/usr/bin/env bash
set -euo pipefail

# One-command predeploy test runner for Lidify.
#
# What it does:
# - Starts a clean docker compose stack (core services only)
# - Runs backend API smoke tests
# - Runs frontend Playwright E2E smoke tests
# - Optionally tears the stack down
#
# Requirements:
# - Docker + docker compose plugin
# - Node/npm available (to run the test runners)
# - A MUSIC_PATH that contains at least one track if you want playback/playlist tests to pass
#
# Environment variables:
# - LIDIFY_UI_BASE_URL (default: http://127.0.0.1:3030)
# - LIDIFY_API_BASE_URL (default: http://127.0.0.1:3006)
# - LIDIFY_TEST_USERNAME (default: predeploy)
# - LIDIFY_TEST_PASSWORD (default: predeploy-password)
# - LIDIFY_COMPOSE_FILE (default: docker-compose.yml)
# - LIDIFY_COMPOSE_PROJECT (default: lidify_predeploy_<timestamp>)
# - LIDIFY_TEARDOWN (default: 1) set to 0 to keep containers running

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMPOSE_FILE="${LIDIFY_COMPOSE_FILE:-docker-compose.yml}"
UI_BASE_URL="${LIDIFY_UI_BASE_URL:-http://127.0.0.1:3030}"
API_BASE_URL="${LIDIFY_API_BASE_URL:-http://127.0.0.1:3006}"
TEARDOWN="${LIDIFY_TEARDOWN:-1}"

PROJECT="${LIDIFY_COMPOSE_PROJECT:-lidify_predeploy_$(date +%Y%m%d_%H%M%S)}"

cd "$ROOT_DIR"

echo "[predeploy] project=$PROJECT"
echo "[predeploy] compose=$COMPOSE_FILE"
echo "[predeploy] ui=$UI_BASE_URL"
echo "[predeploy] api=$API_BASE_URL"

if ! command -v docker >/dev/null 2>&1; then
  echo "[predeploy] ERROR: docker is not installed or not in PATH"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[predeploy] ERROR: docker compose plugin not available (try: docker --version, docker compose version)"
  exit 1
fi

cleanup() {
  if [ "$TEARDOWN" = "1" ]; then
    echo "[predeploy] tearing down docker compose stack..."
    docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down -v
  else
    echo "[predeploy] teardown disabled (LIDIFY_TEARDOWN=0) - leaving containers running"
  fi
}
trap cleanup EXIT

echo "[predeploy] starting docker compose (core services only)..."
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" up -d postgres redis backend frontend

echo "[predeploy] waiting for backend health..."
node - <<'NODE'
const base = (process.env.LIDIFY_API_BASE_URL || "http://127.0.0.1:3006").replace(/\/$/, "");
const timeoutMs = 120000;
const start = Date.now();

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

(async () => {
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) process.exit(0);
    } catch {}
    await sleep(1000);
  }
  console.error(`Backend did not become healthy at ${base}/health within ${timeoutMs}ms`);
  process.exit(1);
})();
NODE

echo "[predeploy] waiting for frontend health..."
node - <<'NODE'
const base = (process.env.LIDIFY_UI_BASE_URL || "http://127.0.0.1:3030").replace(/\/$/, "");
const timeoutMs = 120000;
const start = Date.now();

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

(async () => {
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) process.exit(0);
    } catch {}
    await sleep(1000);
  }
  console.error(`Frontend did not become healthy at ${base}/health within ${timeoutMs}ms`);
  process.exit(1);
})();
NODE

echo "[predeploy] running backend API smoke tests..."
(cd backend && \
  LIDIFY_API_BASE_URL="$API_BASE_URL" \
  LIDIFY_TEST_USERNAME="${LIDIFY_TEST_USERNAME:-predeploy}" \
  LIDIFY_TEST_PASSWORD="${LIDIFY_TEST_PASSWORD:-predeploy-password}" \
  npm run test:smoke)

echo "[predeploy] ensuring Playwright browser is installed..."
(cd frontend && npx playwright install chromium)

echo "[predeploy] running frontend E2E smoke tests..."
(cd frontend && \
  LIDIFY_UI_BASE_URL="$UI_BASE_URL" \
  LIDIFY_TEST_USERNAME="${LIDIFY_TEST_USERNAME:-predeploy}" \
  LIDIFY_TEST_PASSWORD="${LIDIFY_TEST_PASSWORD:-predeploy-password}" \
  npm run test:e2e)

echo "[predeploy] PASS"








