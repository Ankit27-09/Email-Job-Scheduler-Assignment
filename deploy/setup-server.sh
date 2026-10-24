#!/usr/bin/env bash
# One-time setup for an Amazon Linux 2023 host: Docker, Compose, Buildx, swap.
set -euo pipefail

sudo dnf install -y docker tar
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

PLUGINS=/usr/local/lib/docker/cli-plugins
sudo mkdir -p "$PLUGINS"

if ! docker compose version >/dev/null 2>&1; then
  sudo curl -fsSL -o "$PLUGINS/docker-compose" \
    https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64
  sudo chmod +x "$PLUGINS/docker-compose"
fi

if ! docker buildx version >/dev/null 2>&1; then
  BUILDX_VERSION=$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | grep -m1 '"tag_name"' | cut -d '"' -f4)
  sudo curl -fsSL -o "$PLUGINS/docker-buildx" \
    "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64"
  sudo chmod +x "$PLUGINS/docker-buildx"
fi

# 2 GB of RAM is tight for npm installs and the Vite build.
if [ ! -f /swapfile ]; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

docker --version
sudo docker compose version
sudo docker buildx version
