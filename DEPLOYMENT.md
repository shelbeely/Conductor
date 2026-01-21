# Deployment guide

This guide covers different ways to deploy and run Conductor in production or persistent environments.

## Systemd user service

The most common deployment method for personal use. Runs Conductor as a systemd user service that starts automatically.

**Create service file:**

```bash
mkdir -p ~/.config/systemd/user/
nano ~/.config/systemd/user/conductor.service
```

**Service configuration:**

```ini
[Unit]
Description=Conductor TUI Music Player
After=mpd.service
Requires=mpd.service

[Service]
Type=simple
WorkingDirectory=/home/youruser/Conductor
ExecStart=/usr/local/bin/bun start
Restart=on-failure
RestartSec=10

# Environment variables (alternative to .env file)
Environment="AI_PROVIDER=ollama"
Environment="OLLAMA_BASE_URL=http://localhost:11434"
Environment="MPD_HOST=localhost"
Environment="MPD_PORT=6600"

# For OpenRouter/Anthropic, add API keys (better to use .env file for security)
# Environment="OPENROUTER_API_KEY=your_key_here"

[Install]
WantedBy=default.target
```

Replace `/home/youruser/Conductor` with your actual path.

**Enable and start:**

```bash
# Reload systemd
systemctl --user daemon-reload

# Enable auto-start on login
systemctl --user enable conductor.service

# Start now
systemctl --user start conductor.service

# Check status
systemctl --user status conductor.service
```

**View logs:**

```bash
# Live logs
journalctl --user -u conductor.service -f

# Last 100 lines
journalctl --user -u conductor.service -n 100
```

**Enable linger (start on boot, not just login):**

```bash
sudo loginctl enable-linger $USER
```

Now Conductor starts when the system boots, even if you're not logged in.

**Stop or disable:**

```bash
# Stop service
systemctl --user stop conductor.service

# Disable auto-start
systemctl --user disable conductor.service
```

## Systemd system service

If you want Conductor to run system-wide (all users, starts before login).

**Create service file:**

```bash
sudo nano /etc/systemd/system/conductor.service
```

**System service configuration:**

```ini
[Unit]
Description=Conductor TUI Music Player
After=network.target mpd.service
Requires=mpd.service

[Service]
Type=simple
User=youruser
Group=yourgroup
WorkingDirectory=/home/youruser/Conductor
ExecStart=/usr/local/bin/bun start
Restart=on-failure
RestartSec=10

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/youruser/Conductor
ReadWritePaths=/home/youruser/.cache
ReadWritePaths=/home/youruser/.config

# Environment
Environment="AI_PROVIDER=ollama"
Environment="MPD_HOST=localhost"
Environment="MPD_PORT=6600"

[Install]
WantedBy=multi-user.target
```

Replace `youruser` and `yourgroup` with actual values.

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable conductor.service
sudo systemctl start conductor.service
sudo systemctl status conductor.service
```

**View logs:**

```bash
sudo journalctl -u conductor.service -f
```

## Docker deployment

Run Conductor in a container.

**Dockerfile:**

```dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install

# Copy source
COPY . .

# Build
RUN bun run build

# Runtime stage
FROM oven/bun:1-slim

WORKDIR /app

# Install MPD client (for mpc commands if needed)
RUN apt-get update && \
    apt-get install -y mpc && \
    rm -rf /var/lib/apt/lists/*

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment defaults
ENV AI_PROVIDER=ollama
ENV MPD_HOST=mpd
ENV MPD_PORT=6600

ENTRYPOINT ["bun", "start"]
```

**Build:**

```bash
docker build -t conductor:latest .
```

**Run:**

```bash
docker run -it --rm \
  --network host \
  -e AI_PROVIDER=ollama \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -e MPD_HOST=localhost \
  -e MPD_PORT=6600 \
  conductor:latest
```

**Docker Compose:**

```yaml
version: '3.8'

services:
  mpd:
    image: vimagick/mpd:latest
    volumes:
      - ./music:/var/lib/mpd/music:ro
      - mpd-data:/var/lib/mpd
    ports:
      - "6600:6600"
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    restart: unless-stopped

  conductor:
    build: .
    stdin_open: true
    tty: true
    depends_on:
      - mpd
      - ollama
    environment:
      - AI_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://ollama:11434
      - MPD_HOST=mpd
      - MPD_PORT=6600
    network_mode: service:mpd
    restart: unless-stopped

volumes:
  mpd-data:
  ollama-data:
```

**Start with Compose:**

```bash
docker-compose up -d
```

Note: Interactive TUI in Docker has limitations. This works better for API-only deployments or background services.

## Installation scripts

Automated installation for common platforms.

**Universal install script:**

```bash
#!/bin/bash
# install-conductor.sh

set -e

echo "Installing Conductor..."

# Check for bun
if ! command -v bun &> /dev/null; then
    echo "Installing bun.js..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

# Clone repository
if [ ! -d "$HOME/Conductor" ]; then
    echo "Cloning Conductor..."
    git clone https://github.com/shelbeely/Conductor.git "$HOME/Conductor"
fi

cd "$HOME/Conductor"

# Install dependencies
echo "Installing dependencies..."
bun install

# Build
echo "Building Conductor..."
bun run build

# Check for MPD
if ! command -v mpd &> /dev/null; then
    echo "MPD not found. Install it manually:"
    echo "  Debian/Ubuntu: sudo apt install mpd mpc"
    echo "  Arch: sudo pacman -S mpd mpc"
    echo "  Fedora: sudo dnf install mpd mpc"
fi

# Check for Ollama
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Install it for local AI:"
    echo "  curl -fsSL https://ollama.ai/install.sh | sh"
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
MPD_HOST=localhost
MPD_PORT=6600
EOF
    echo ".env file created. Edit it if needed."
fi

# Install systemd service
read -p "Install systemd service? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p ~/.config/systemd/user/
    
    cat > ~/.config/systemd/user/conductor.service << EOF
[Unit]
Description=Conductor TUI Music Player
After=mpd.service
Requires=mpd.service

[Service]
Type=simple
WorkingDirectory=$HOME/Conductor
ExecStart=$(which bun) start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
EOF
    
    systemctl --user daemon-reload
    systemctl --user enable conductor.service
    
    echo "Systemd service installed. Start with: systemctl --user start conductor"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Start MPD: systemctl --user start mpd"
echo "  2. Run Conductor: cd ~/Conductor && bun start"
echo ""
echo "For Ollama:"
echo "  1. Install: curl -fsSL https://ollama.ai/install.sh | sh"
echo "  2. Pull model: ollama pull llama3.2"
echo ""
```

**Make it executable:**

```bash
chmod +x install-conductor.sh
```

**Run:**

```bash
./install-conductor.sh
```

**Platform-specific variants:**

For Debian/Ubuntu, add package installation:

```bash
# In the script, before "Clone repository"
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y mpd mpc git curl
```

For Arch Linux:

```bash
echo "Installing system dependencies..."
sudo pacman -S --noconfirm mpd mpc git curl
```

## Binary distribution

Package Conductor as a single binary using bun's bundler.

**Build standalone binary:**

```bash
bun build ./src/index.tsx --compile --outfile conductor
```

This creates a `conductor` binary with bun runtime embedded.

**Distribute:**

```bash
# Copy to user's bin
cp conductor ~/.local/bin/

# Or system-wide
sudo cp conductor /usr/local/bin/
```

Users run:

```bash
conductor
```

No bun installation needed.

**Create .deb package:**

```bash
# Structure
mkdir -p conductor-deb/DEBIAN
mkdir -p conductor-deb/usr/local/bin
mkdir -p conductor-deb/etc/conductor

# Binary
cp conductor conductor-deb/usr/local/bin/

# Control file
cat > conductor-deb/DEBIAN/control << 'EOF'
Package: conductor
Version: 0.2.0
Section: sound
Priority: optional
Architecture: amd64
Depends: mpd
Maintainer: Your Name <your@email.com>
Description: TUI music player with AI-powered commands
 Conductor is a terminal music player that controls MPD using natural language.
EOF

# Build package
dpkg-deb --build conductor-deb
mv conductor-deb.deb conductor_0.2.0_amd64.deb
```

**Install .deb:**

```bash
sudo dpkg -i conductor_0.2.0_amd64.deb
```

**Create .rpm package:**

Similar process using `rpmbuild`.

## Cloud deployments

Running Conductor on a remote server.

**Basic VPS setup:**

```bash
# SSH into server
ssh user@your-server.com

# Install dependencies
sudo apt update
sudo apt install -y mpd mpc git curl

# Install bun
curl -fsSL https://bun.sh/install | bash

# Clone and build
git clone https://github.com/shelbeely/Conductor.git
cd Conductor
bun install
bun run build

# Configure MPD
mkdir -p ~/.config/mpd
# Edit ~/.config/mpd/mpd.conf with your settings

# Start MPD
systemctl --user start mpd

# Run Conductor
bun start
```

**Access via SSH:**

From your local machine:

```bash
ssh -t user@your-server.com "cd Conductor && bun start"
```

The `-t` flag allocates a TTY for the interactive interface.

**Persistent session with tmux:**

```bash
# On server
tmux new -s conductor
cd Conductor
bun start

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t conductor
```

**Reverse proxy (if exposing HTTP API in future):**

nginx config for future HTTP endpoints:

```nginx
server {
    listen 80;
    server_name conductor.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development vs. production configs

**Development:**

```bash
# .env.dev
AI_PROVIDER=ollama
AI_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
MPD_HOST=localhost
MPD_PORT=6600
LOG_LEVEL=debug
```

Run with:

```bash
bun run dev
```

**Production:**

```bash
# .env.prod
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
AI_MODEL=anthropic/claude-3.5-sonnet
MPD_HOST=localhost
MPD_PORT=6600
LOG_LEVEL=info
```

Run with:

```bash
bun start
```

## Updating deployments

**Manual update:**

```bash
cd ~/Conductor
git pull
bun install
bun run build

# Restart service
systemctl --user restart conductor
```

**Automated update script:**

```bash
#!/bin/bash
# update-conductor.sh

set -e

cd ~/Conductor

echo "Pulling latest changes..."
git pull

echo "Installing dependencies..."
bun install

echo "Building..."
bun run build

echo "Restarting service..."
systemctl --user restart conductor

echo "Update complete!"
systemctl --user status conductor
```

**Rollback:**

```bash
cd ~/Conductor
git log --oneline
git checkout <previous-commit-hash>
bun install
bun run build
systemctl --user restart conductor
```

## Monitoring and logging

**Log rotation for systemd:**

Journald handles this automatically, but you can configure:

```bash
# /etc/systemd/journald.conf
[Journal]
SystemMaxUse=100M
SystemKeepFree=500M
MaxFileSec=1week
```

**Export logs:**

```bash
journalctl --user -u conductor.service > conductor.log
```

**Monitor with watch:**

```bash
watch -n 1 'systemctl --user status conductor | tail -20'
```

**Health checks:**

```bash
#!/bin/bash
# health-check.sh

# Check if service is running
if systemctl --user is-active --quiet conductor; then
    echo "Conductor is running"
else
    echo "Conductor is not running! Restarting..."
    systemctl --user restart conductor
fi

# Check MPD connection
if mpc status &> /dev/null; then
    echo "MPD connection OK"
else
    echo "MPD connection failed!"
fi
```

Run via cron:

```bash
*/5 * * * * ~/scripts/health-check.sh
```

## Backup and restore

**Backup configuration:**

```bash
#!/bin/bash
# backup-conductor.sh

BACKUP_DIR="$HOME/conductor-backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup .env
cp ~/Conductor/.env "$BACKUP_DIR/"

# Backup MPD config
cp -r ~/.config/mpd "$BACKUP_DIR/"

# Backup playlists
cp -r ~/.config/mpd/playlists "$BACKUP_DIR/" || true

echo "Backup saved to $BACKUP_DIR"
```

**Restore:**

```bash
#!/bin/bash
# restore-conductor.sh

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-directory>"
    exit 1
fi

BACKUP_DIR="$1"

# Restore .env
cp "$BACKUP_DIR/.env" ~/Conductor/

# Restore MPD config
cp -r "$BACKUP_DIR/mpd" ~/.config/

echo "Restored from $BACKUP_DIR"
echo "Restart services to apply changes"
```

## Multi-user deployments

If multiple users need Conductor on the same system:

**Per-user installations:**

Each user clones and runs their own instance:

```bash
git clone https://github.com/shelbeely/Conductor.git ~/Conductor
cd ~/Conductor
bun install
bun run build
systemctl --user enable --now conductor
```

Each user gets their own MPD instance and Conductor config.

**Shared MPD instance:**

Configure MPD to run system-wide:

```bash
sudo systemctl enable mpd
sudo systemctl start mpd
```

Edit `/etc/mpd.conf` to allow network connections:

```conf
bind_to_address "0.0.0.0"
port "6600"
```

Users connect to shared MPD:

```bash
MPD_HOST=localhost
MPD_PORT=6600
```

This allows collaborative playlists and shared music control.

## Security in production

- **Use environment variables for secrets**, not .env files in shared environments
- **Restrict file permissions**: `chmod 600 .env`
- **Firewall MPD if exposed**: `sudo ufw allow from <trusted-ip> to any port 6600`
- **Use SSH tunnels** for remote access instead of exposing ports
- **Monitor API key usage** through provider dashboards
- **Keep dependencies updated**: `bun update`
- **Run as non-root user** (systemd user services do this by default)

## Troubleshooting deployments

**Service won't start:**

```bash
# Check logs
journalctl --user -u conductor.service -n 50

# Check MPD is running
systemctl --user status mpd

# Test manually
cd ~/Conductor
bun start
```

**MPD connection issues:**

```bash
# Test MPD directly
mpc status

# Check MPD logs
journalctl --user -u mpd.service -n 50

# Verify config
cat ~/.config/mpd/mpd.conf
```

**Permission denied errors:**

```bash
# Fix ownership
chown -R $USER:$USER ~/Conductor

# Fix permissions
chmod -R u+rw ~/Conductor
```

**Out of memory:**

Increase systemd memory limits in service file:

```ini
[Service]
MemoryMax=512M
```

## Summary

Deployment options:

- **Systemd user service**: Best for personal use, auto-starts on login
- **Systemd system service**: Starts on boot, runs before login
- **Docker**: Containerized, isolated environment
- **Standalone binary**: Single-file distribution
- **Cloud/VPS**: Remote access via SSH
- **Manual**: Just `bun start` when needed

Choose based on your needs. Most users want systemd user service for auto-start on their desktop Linux system.
