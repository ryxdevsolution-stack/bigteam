#!/bin/bash

# BigTeam Deployment Script for Hostinger VPS
# Domain: bigtreat.in
# VPS IP: 88.222.241.250

set -e

echo "=========================================="
echo "BigTeam Deployment Script"
echo "=========================================="

# Update system
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# Install dependencies
echo "[2/8] Installing dependencies..."
apt install -y python3 python3-pip python3-venv nginx redis-server git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Clone or update project
echo "[3/8] Setting up project..."
if [ -d "/var/www/bigteam" ]; then
    cd /var/www/bigteam
    git pull origin main
else
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/YOUR_USERNAME/bigteam.git
    cd bigteam
fi

# Setup Backend
echo "[4/8] Setting up backend..."
cd /var/www/bigteam/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Setup Frontend
echo "[5/8] Building frontend..."
cd /var/www/bigteam/frontend
npm install
VITE_API_BASE_URL=https://bigtreat.in/api npm run build

# Setup NGINX
echo "[6/8] Configuring NGINX..."
cp /var/www/bigteam/infrastructure/nginx/bigtreat.in.conf /etc/nginx/sites-available/bigtreat.in
ln -sf /etc/nginx/sites-available/bigtreat.in /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup Backend Service
echo "[7/8] Setting up backend service..."
cp /var/www/bigteam/infrastructure/systemd/bigteam-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable bigteam-backend
systemctl restart bigteam-backend

# Set permissions
echo "[8/8] Setting permissions..."
chown -R www-data:www-data /var/www/bigteam

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Add SSL: certbot --nginx -d bigtreat.in -d www.bigtreat.in"
echo "2. Check status: systemctl status bigteam-backend"
echo "3. View logs: journalctl -u bigteam-backend -f"
echo ""
