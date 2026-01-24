# Conductor Setup Guide

## 🚀 Quick Start: Interactive Setup Wizard (Recommended)

**The easiest way to get started!** Our interactive wizard installs and configures everything for you.

```bash
# Clone the repository
git clone https://github.com/shelbeely/Conductor.git
cd Conductor

# Install Conductor dependencies
bun install
# Or with npm: npm install

# Run the interactive setup wizard
bun run setup
# Or with npm: npm run setup
```

### What the wizard does:

1. **Installs MPD** (Music Player Daemon) - Required
   - Auto-detects your package manager (apt, pacman, brew)
   - Creates configuration files
   - Starts the service

2. **Installs Ollama** (Local AI) - Recommended
   - Installs Ollama
   - Lets you choose and download a model (llama3.2, mistral, qwen2.5)
   - Starts the service

3. **Installs Bark TTS** (Text-to-Speech) - Optional
   - Enables AI DJ hosts with non-verbal sounds ([laughs], [sighs], etc.)
   - Downloads models (~2GB)

4. **Installs Überzug++** (Album Art) - Optional
   - Shows album covers in terminal
   - Fallback to ASCII art if not installed

5. **Creates .env file** - Automatic
   - Configures everything based on your choices
   - Ready to use immediately

### After the wizard completes:

```bash
# Add some music to ~/Music/
cp -r /path/to/your/music/* ~/Music/

# Start Conductor
bun start
# Or: npm start

# Try it out!
# Type: "play some jazz"
```

---

## 📖 Manual Setup (Advanced Users)

If you prefer to set things up yourself or the wizard doesn't work on your system, follow these detailed instructions:

## Quick Start

### 1. Install Prerequisites

#### Install bun.js (Recommended)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### Or use Node.js (Fallback)
```bash
# Node.js >= 18.0.0 required
node --version
```

### 2. Install and Setup MPD

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mpd mpc
```

#### Arch Linux
```bash
sudo pacman -S mpd mpc
```

#### macOS
```bash
brew install mpd mpc
```

### 3. Configure MPD

Create MPD configuration directory:
```bash
mkdir -p ~/.config/mpd/playlists
mkdir -p ~/Music
```

Create `~/.config/mpd/mpd.conf`:
```conf
music_directory    "~/Music"
playlist_directory "~/.config/mpd/playlists"
db_file            "~/.config/mpd/database"
log_file           "~/.config/mpd/log"
pid_file           "~/.config/mpd/pid"
state_file         "~/.config/mpd/state"
sticker_file       "~/.config/mpd/sticker.sql"

audio_output {
    type  "pulse"
    name  "PulseAudio"
}

# For macOS, use this instead:
# audio_output {
#     type  "osx"
#     name  "CoreAudio"
# }

bind_to_address    "localhost"
port               "6600"
```

Start MPD:
```bash
# Linux (systemd)
systemctl --user enable mpd
systemctl --user start mpd

# Or run manually
mpd ~/.config/mpd/mpd.conf

# Update music database
mpc update
```

### 4. Setup AI Provider

#### Option A: Local with Ollama

Install Ollama:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

Pull a model:
```bash
ollama pull llama3.2
# Or try other models:
# ollama pull mistral
# ollama pull codellama
```

Start Ollama (if not auto-started):
```bash
ollama serve
```

Configure Conductor:
```bash
cp .env.example .env
# Edit .env:
# AI_PROVIDER=ollama
# AI_MODEL=llama3.2
```

#### Option B: Remote with OpenRouter

1. Get API key from https://openrouter.ai
2. Configure Conductor:
```bash
cp .env.example .env
# Edit .env:
# AI_PROVIDER=openrouter
# OPENROUTER_API_KEY=your_key_here
# AI_MODEL=anthropic/claude-3.5-sonnet
```

### 5. Install Conductor

```bash
# Clone the repository
git clone https://github.com/shelbeely/Conductor.git
cd Conductor

# Install dependencies with bun
bun install

# Or with npm
npm install

# Build
bun run build
# Or: npm run build
```

### 6. Optional: Install Überzug++ for Album Art

#### Arch Linux
```bash
yay -S ueberzug++
# or
paru -S ueberzug++
```

#### From Source
```bash
git clone https://github.com/jstkdng/ueberzugpp.git
cd ueberzugpp
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
cmake --build .
sudo cmake --install .
```

Note: Überzug++ requires X11 or Wayland. If not available, Conductor will fallback to ASCII art.

### 7. Run Conductor

```bash
# With bun
bun start

# Or with npm
npm start

# Or run directly in dev mode
bun run dev
# Or: npm run dev
```

## Troubleshooting

### MPD Won't Start
```bash
# Check logs
tail -f ~/.config/mpd/log

# Verify config
mpd --version

# Test connection
mpc status
```

### No Music Playing
```bash
# Make sure music files are in ~/Music
ls ~/Music

# Update database
mpc update
mpc status

# Check volume
mpc volume 50
```

### Ollama Not Working
```bash
# Check if running
curl http://localhost:11434/api/tags

# Check logs
journalctl -u ollama -f

# Restart
systemctl restart ollama
```

### OpenRouter API Errors
- Verify API key is correct
- Check your account balance
- Try a different model

### Überzug++ Not Displaying
- Ensure you're using a compatible terminal (kitty, alacritty, urxvt, etc.)
- Check if X11/Wayland is available
- Conductor will automatically fallback to ASCII art if unavailable

## Environment Variables Reference

```bash
# MPD Configuration
MPD_HOST=localhost        # MPD server host
MPD_PORT=6600            # MPD server port

# AI Provider
AI_PROVIDER=ollama       # ollama, openrouter, or anthropic

# OpenRouter (remote)
OPENROUTER_API_KEY=sk-or-...
AI_MODEL=anthropic/claude-3.5-sonnet

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
AI_MODEL=llama3.2

# Anthropic (remote - alternative)
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-20241022
```

## Example Music Library Setup

```bash
# Add some music
cp -r /path/to/your/music/* ~/Music/

# Update MPD database
mpc update

# Verify
mpc listall | head -20
```

## Next Steps

Once everything is set up:
1. Run `bun start` or `npm start`
2. Try natural language commands like:
   - "play some jazz"
   - "show me the queue"
   - "skip to next track"
   - "set volume to 75"
3. Use arrow keys to navigate history
4. Press Ctrl+C to quit
