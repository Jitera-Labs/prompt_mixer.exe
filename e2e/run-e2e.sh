#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Prompt Mixer E2E Tests ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check WebKitWebDriver
if ! command -v WebKitWebDriver &> /dev/null; then
  echo "ERROR: WebKitWebDriver not found."
  echo "Install it with: sudo apt install webkit2gtk-driver"
  exit 1
fi
echo "  ✓ WebKitWebDriver found at $(which WebKitWebDriver)"

# Check tauri-driver
TAURI_DRIVER="$HOME/.cargo/bin/tauri-driver"
if [ ! -f "$TAURI_DRIVER" ]; then
  echo "ERROR: tauri-driver not found at $TAURI_DRIVER"
  echo "Install it with: cargo install tauri-driver --locked"
  exit 1
fi
echo "  ✓ tauri-driver found at $TAURI_DRIVER"

# Check if binary exists (optional - wdio config will build it)
BINARY="$PROJECT_DIR/src-tauri/target/debug/prompt-mixer"
if [ -f "$BINARY" ]; then
  echo "  ✓ Debug binary found (will rebuild if needed)"
else
  echo "  ⚠ Debug binary not found (will be built during test)"
fi

echo ""
echo "Running E2E tests..."
cd "$PROJECT_DIR"
npx wdio run ./wdio.conf.ts
