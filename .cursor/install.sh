#!/usr/bin/env bash
# Idempotent Cloud Agent setup for RoomMind.
#
# Mirrors .devcontainer/setup.sh but targets the Cloud Agent VM (ubuntu user,
# repo checked out at the current working directory). Safe to re-run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> Installing system packages"
sudo apt-get update -qq
# python3.12-venv provides ensurepip so `python3 -m venv` works on the base image.
sudo apt-get install -y --no-install-recommends \
    python3.12-venv \
    build-essential \
    pkg-config \
    libffi-dev \
    libssl-dev

echo "==> Creating Python virtualenv"
if [ ! -x ".venv/bin/python" ]; then
    python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip setuptools wheel

echo "==> Installing backend (dev) dependencies"
# pytest-homeassistant-custom-component pins the Home Assistant test toolchain.
pip install -r requirements-dev.txt

echo "==> Pre-installing Home Assistant component dependencies"
# Built-in components in the dev configuration.yaml lazily pip-install these at
# runtime; pre-installing keeps first boot clean. zlib-ng/isal silence HA perf
# warnings.
pip install hassil mutagen home-assistant-intents home-assistant-frontend zlib-ng isal

echo "==> Installing frontend dependencies and building the panel"
(
    cd frontend
    npm ci
    npm run build
)

echo "==> Setting up the Home Assistant config directory (/config)"
sudo mkdir -p /config/custom_components /config/logs \
    /config/blueprints/automation /config/blueprints/script
sudo chown -R "$(id -un):$(id -gn)" /config
cp .devcontainer/configuration.yaml /config/configuration.yaml
cp .devcontainer/automations.yaml /config/automations.yaml
cp .devcontainer/scripts.yaml /config/scripts.yaml
cp .devcontainer/scenes.yaml /config/scenes.yaml
# Symlink the integration so HA loads it from the repo checkout.
ln -sfn "${REPO_ROOT}/custom_components/roommind" /config/custom_components/roommind

echo "==> Setup complete"
echo "    Backend:  source .venv/bin/activate && pytest tests/"
echo "    Frontend: (cd frontend && npm run build)"
echo "    Run HA:   source .venv/bin/activate && hass --config /config  (http://localhost:8123)"
