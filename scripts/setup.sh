#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-}"

if [ -z "$PYTHON_BIN" ]; then
  if command -v python3.13 >/dev/null 2>&1; then
    PYTHON_BIN="python3.13"
  elif command -v python3.12 >/dev/null 2>&1; then
    PYTHON_BIN="python3.12"
  else
    echo "Python 3.12+ is required. Install Python 3.13 or set PYTHON_BIN=/path/to/python."
    exit 1
  fi
fi

bun install

if [ ! -d ".venv" ]; then
  "$PYTHON_BIN" -m venv .venv
fi

. .venv/bin/activate
pip install --upgrade pip
pip install -e "apps/api[dev]"

echo "Grapeee dependencies installed."
