# Conductor Troubleshooting Guide

Got something not working? This guide walks through common problems and how to fix them.

## Quick Diagnostics

Before diving into specific issues, run these checks:

```bash
# Check if MPD is running
systemctl --user status mpd
# Or: ps aux | grep mpd

# Test MPD connection
mpc status

# Verify Conductor can reach MPD
telnet localhost 6600
# Press Ctrl+] then type 'quit' to exit

# Check your .env file exists and has required variables
cat .env
```

---

## 1. MPD Connection Problems

### Can't connect to MPD

**Symptoms:**
- "Connection refused" errors
- "Failed to connect to MPD" messages
- App exits immediately

**Check if MPD is running:**
```bash
systemctl --user status mpd
# If stopped, start it:
systemctl --user start mpd
```

**Check MPD logs for errors:**
```bash
tail -50 ~/.config/mpd/log
# Look for bind_to_address errors or port conflicts
```

**Verify MPD is listening:**
```bash
netstat -tuln | grep 6600
# Should show: tcp 0.0.0.0:6600 LISTEN
```

**Fix:** If MPD won't start, check your config file:
```bash
mpd --version  # Check if MPD is installed
mpd --no-daemon ~/.config/mpd/mpd.conf  # Run in foreground to see errors
```

Common config issues:
- Music directory doesn't exist or is inaccessible
- Database file location not writable
- Audio output device not available

### Connection timeouts

**Symptoms:**
- App hangs when trying to connect
- "Connection timeout" after 5-10 seconds

**Check network/firewall:**
```bash
# Test if port is accessible
telnet localhost 6600
# Or: nc -zv localhost 6600
```

**Fix:** If MPD is bound to wrong address, edit `~/.config/mpd/mpd.conf`:
```conf
bind_to_address "localhost"
# Not: bind_to_address "127.0.0.1"
# Not: bind_to_address "::1"
```

Then restart MPD:
```bash
systemctl --user restart mpd
```

### Authentication required

**Symptoms:**
- "Password required" errors
- Connection rejected

**Check if password is set in MPD config:**
```bash
grep password ~/.config/mpd/mpd.conf
```

**Fix:** Add password to your .env file:
```bash
MPD_HOST=yourpassword@localhost
MPD_PORT=6600
```

Or remove password requirement from `mpd.conf` if not needed:
```conf
# Comment out or remove:
# password "yourpassword@read,add,control,admin"
```

### MPD crashes on startup

**Check logs:**
```bash
journalctl --user -u mpd -n 50
# Or: tail -100 ~/.config/mpd/log
```

**Common causes:**
- Corrupted database file
- Permission issues
- Invalid audio output config

**Fix corrupted database:**
```bash
rm ~/.config/mpd/database
mpd ~/.config/mpd/mpd.conf
mpc update
```

---

## 2. Audio Playback Issues

### No sound output

**First, check volume:**
```bash
mpc volume
# Set to 50%:
mpc volume 50
```

**Check if MPD is actually playing:**
```bash
mpc status
# Should show: [playing] or [paused]
```

**Verify audio output is configured:**
```bash
grep -A5 "audio_output" ~/.config/mpd/mpd.conf
```

**Test PulseAudio separately:**
```bash
pactl list sinks
# Your output device should be listed
```

**Fix:** Update MPD audio output in `~/.config/mpd/mpd.conf`:

For PulseAudio (most Linux):
```conf
audio_output {
    type  "pulse"
    name  "PulseAudio Output"
}
```

For ALSA:
```conf
audio_output {
    type  "alsa"
    name  "ALSA Output"
    device "hw:0,0"  # Adjust to your device
}
```

For PipeWire:
```conf
audio_output {
    type  "pipewire"
    name  "PipeWire Output"
}
```

After changing, restart MPD:
```bash
systemctl --user restart mpd
```

### Audio crackling or stuttering

**Increase MPD buffer size.** Edit `~/.config/mpd/mpd.conf`:
```conf
audio_buffer_size "4096"  # Default is 2048
buffer_before_play "20%"  # Default is 10%
```

**Check system load:**
```bash
top
# Look for high CPU usage
```

**For ALSA, try different period settings:**
```conf
audio_output {
    type  "alsa"
    name  "ALSA"
    device "hw:0,0"
    period_time "50000"  # Microseconds
}
```

### Playing to wrong audio device

**List available devices:**
```bash
# For PulseAudio:
pactl list sinks | grep -E "Name:|Description:"

# For ALSA:
aplay -L
```

**Fix:** Specify exact device in `~/.config/mpd/mpd.conf`:
```conf
audio_output {
    type  "pulse"
    name  "My Speakers"
    sink "alsa_output.pci-0000_00_1b.0.analog-stereo"
}
```

Or use `pavucontrol` (GUI) to redirect MPD's stream while it's playing.

### Files won't play (format errors)

**Check MPD decoder plugins:**
```bash
mpd --version
# Look for: Decoders plugins: mp3 flac ogg wav ...
```

**Install missing codecs:**
```bash
# Debian/Ubuntu:
sudo apt install libavcodec-extra

# Arch:
sudo pacman -S ffmpeg
```

Then restart MPD.

---

## 3. AI Provider Problems

### OpenRouter API errors

**"Invalid API key":**
- Verify key in .env: `OPENROUTER_API_KEY=sk-or-...`
- Check for extra spaces or quotes
- Generate new key at https://openrouter.ai/keys

**"Insufficient credits":**
- Check your balance at https://openrouter.ai/account
- Add credits to your account

**"Rate limit exceeded":**
- You're sending requests too fast
- Wait 60 seconds and try again
- Consider upgrading your plan

**"Model not found":**
Check available models:
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

Update AI_MODEL in .env to a valid model name.

**Connection timeouts:**
```bash
# Test API connectivity:
curl -I https://openrouter.ai
# Should return: HTTP/2 200
```

Check your network/proxy settings.

### Ollama connection issues

**"Failed to connect to Ollama":**

Check if Ollama is running:
```bash
curl http://localhost:11434/api/tags
# Should return JSON with model list
```

If not running, start it:
```bash
# If installed as service:
systemctl start ollama

# Or run manually:
ollama serve
```

**Model not found:**
```bash
# List installed models:
ollama list

# Pull the model you want:
ollama pull llama3.2
```

Update AI_MODEL in .env to match installed model name.

**Ollama is slow:**

Check if GPU acceleration is working:
```bash
ollama ps
# Should show model loaded with GPU info
```

If CPU-only, responses will be slower. Consider:
- Using a smaller model (e.g., llama3.2:1b instead of llama3.2:70b)
- Switching to OpenRouter for cloud-based inference
- Upgrading hardware

**Port conflicts:**

If default port 11434 is taken:
```bash
# Run Ollama on different port:
OLLAMA_HOST=0.0.0.0:11435 ollama serve

# Update .env:
OLLAMA_BASE_URL=http://localhost:11435
```

### Anthropic API errors

Similar to OpenRouter, but check:
- API key starts with `sk-ant-`
- Model name is exact: `claude-3-5-sonnet-20241022`
- Check status at https://status.anthropic.com

### AI responses are bad or nonsensical

**Try a different model:**
- Some models are better at structured command parsing
- Claude models generally perform well for this use case
- Smaller local models (< 7B params) may struggle

**Check your prompt/command:**
- Be specific: "play jazz" not "idk play something"
- Use clear action words: "skip track" not "next"

**Verify .env configuration:**
```bash
cat .env | grep AI_
# Make sure AI_PROVIDER matches your setup
```

---

## 4. Metadata Fetching Issues

### MusicBrainz timeouts

**Symptoms:**
- "Failed to fetch metadata" warnings
- Slow startup or track changes

**Check connectivity:**
```bash
curl -I https://musicbrainz.org
# Should return: HTTP/2 200
```

**Rate limiting:**
MusicBrainz limits to 1 request/second for anonymous users.

Conductor should handle this automatically, but if you're seeing errors, the cache might not be working.

**Check cache:**
```bash
ls -lh ~/.cache/conductor/metadata/
# Should contain .json files
```

**Fix:** Clear corrupted cache:
```bash
rm -rf ~/.cache/conductor/metadata/
# Cache will rebuild automatically
```

### Wrong metadata returned

MusicBrainz matches by artist and album name. If your music files have incorrect tags, metadata will be wrong.

**Check file tags:**
```bash
# Install exiftool:
sudo apt install libimage-exiftool-perl

# Check tags:
exiftool ~/Music/your-album/song.mp3 | grep -E "Artist|Album|Title"
```

**Fix tags with a proper tagger:**
- MusicBrainz Picard (GUI): https://picard.musicbrainz.org
- `mid3v2` (command line): `sudo apt install python3-mutagen`

After fixing tags:
```bash
mpc update
rm -rf ~/.cache/conductor/metadata/
```

### No metadata at all

**Check if track has basic info:**
```bash
mpc current --format "%artist% - %album% - %title%"
```

If this returns nothing, your files have no tags. Conductor can't fetch metadata without at least artist and title.

---

## 5. Album Art Display Problems

### Überzug++ not showing images

**Check if Überzug++ is installed:**
```bash
which ueberzug
# Or: which ueberzugpp
```

If not found, install it (see SETUP.md).

**Verify X11 or Wayland is available:**
```bash
echo $DISPLAY
# Should show :0 or similar

echo $WAYLAND_DISPLAY
# Should show wayland-0 or similar
```

If both are empty, Überzug++ won't work (you're in a TTY or SSH session without X forwarding).

**Check terminal compatibility:**

Überzug++ works best with:
- kitty
- alacritty  
- urxvt
- st

May not work with:
- gnome-terminal (depends on version)
- tmux (requires special config)
- screen (not supported)

**Test Überzug++ directly:**
```bash
ueberzug layer
# Then in another terminal:
ueberzug cmd -s /tmp/ueberzug_fifo -a add -i test \
  -x 0 -y 0 -w 20 -h 20 --path /path/to/image.jpg
```

If this doesn't work, the issue is with Überzug++, not Conductor.

### Images are corrupted or wrong size

**Terminal font size matters.** Überzug++ uses character cells as units. If images look stretched:
- Adjust terminal font size
- Conductor tries to auto-detect cell dimensions but may need manual tweaking

**Image format issues:**

Überzug++ supports: JPG, PNG, GIF

If album art is in weird format (WEBP, BMP), it might fail. Conductor should handle conversion, but check logs.

### ASCII art fallback isn't working

If both Überzug++ fails AND ASCII art doesn't appear, check:
```bash
# Test ASCII art generator:
which jp2a
sudo apt install jp2a
```

Conductor should work without this, but if seeing errors, file a bug report with logs.

---

## 6. UI Rendering Issues

### Terminal looks broken or corrupted

**Try resetting terminal:**
```bash
reset
# Or: tput reset
```

**Check terminal size:**
```bash
tput cols
tput lines
# Minimum: 80 cols x 24 lines recommended
```

**If using tmux/screen:**

Add to `~/.tmux.conf`:
```conf
set -g default-terminal "screen-256color"
set-option -ga terminal-overrides ",xterm-256color:Tc"
```

Reload:
```bash
tmux source-file ~/.tmux.conf
```

### Colors are wrong or missing

**Check terminal color support:**
```bash
echo $TERM
# Should be: xterm-256color, screen-256color, etc.
```

**Test 256 colors:**
```bash
for i in {0..255}; do
    printf "\x1b[48;5;${i}m%3d " "$i"
    [ $((($i + 1) % 16)) -eq 0 ] && echo
done
```

If colors don't show, your terminal doesn't support 256 colors. Set TERM:
```bash
export TERM=xterm-256color
```

Add to `~/.bashrc` to persist.

### Text is overlapping or misaligned

Usually caused by:
- Terminal resize during operation
- Unicode characters not rendering correctly
- Font without proper glyph support

**Fix:**
- Quit and restart Conductor (Ctrl+C)
- Use a monospace font with good Unicode support (Fira Code, JetBrains Mono, etc.)
- Increase terminal size

### Mouse doesn't work

Conductor is keyboard-driven. Mouse support isn't implemented. Use:
- Arrow keys for navigation
- Enter to submit commands
- Ctrl+C to quit

---

## 7. Performance Problems

### Slow response to commands

**Check AI provider latency:**

For Ollama:
```bash
time curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "play jazz",
  "stream": false
}'
```

If this takes > 5 seconds, your model is too large for your hardware.

For OpenRouter:
```bash
time curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{"model": "anthropic/claude-3.5-sonnet", "messages": [{"role": "user", "content": "test"}]}'
```

If slow, check your internet connection.

**Check MPD response time:**
```bash
time mpc status
# Should be < 0.1 seconds
```

If slow, MPD database might be huge. Check:
```bash
du -sh ~/.config/mpd/database
```

If > 100MB, consider splitting your music library or enabling:
```conf
# In mpd.conf:
auto_update "yes"
auto_update_depth "3"
```

### High CPU usage

**Check what's using CPU:**
```bash
top
# Press 'P' to sort by CPU
```

**If Conductor is using high CPU:**
- Check for infinite loops in logs
- Update to latest version (may have performance fixes)
- File a bug report with steps to reproduce

**If Ollama is using high CPU:**
- This is expected during inference
- Use a smaller model
- Reduce context length in prompt

**If MPD is using high CPU:**
- Check audio output settings (buffer sizes)
- Disable visualizer/spectrum analyzer if enabled
- Check for corrupted audio files: `mpc listall | xargs -I {} mpd --test {}`

### High memory usage

**Check memory:**
```bash
free -h
ps aux --sort=-%mem | head
```

**Ollama models use RAM:**
- llama3.2:1b ~1GB
- llama3.2:3b ~2GB  
- llama3.2:7b ~4GB
- llama3.2:70b ~40GB

If you're running out of memory, use OpenRouter instead of local models.

**Memory leaks:**

If Conductor memory grows over time:
- Restart the app
- Check for update with fix
- File bug report with monitoring data

---

## 8. Installation Issues

### bun install fails

**Check bun version:**
```bash
bun --version
# Minimum: 1.0.0
```

**Update bun:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Network issues during install:**
```bash
# Use verbose mode to see what's failing:
bun install --verbose

# Try clearing cache:
rm -rf ~/.bun/install/cache
bun install
```

**Fallback to npm:**
```bash
npm install
npm run build
```

### Build failures (TypeScript errors)

**Type check:**
```bash
bun run type-check
# Or: npm run type-check
```

**Clean rebuild:**
```bash
rm -rf node_modules
rm bun.lockb
bun install
bun run build
```

**If you get errors about missing types:**
```bash
bun add -d @types/node @types/react
```

### Module not found errors

**Check node_modules exists:**
```bash
ls -la node_modules/
```

**Reinstall dependencies:**
```bash
rm -rf node_modules bun.lockb
bun install
```

### Permission errors

**Fix ownership:**
```bash
sudo chown -R $USER:$USER ~/Conductor
```

**Don't run as root.** Conductor should run as regular user.

---

## 9. Configuration Errors

### .env file issues

**Check file exists:**
```bash
ls -la .env
cat .env
```

**Common mistakes:**
```bash
# WRONG - quotes around values:
AI_PROVIDER="ollama"

# RIGHT - no quotes:
AI_PROVIDER=ollama

# WRONG - spaces around =:
AI_PROVIDER = ollama

# RIGHT - no spaces:
AI_PROVIDER=ollama

# WRONG - trailing spaces:
AI_PROVIDER=ollama  

# RIGHT - trim whitespace:
AI_PROVIDER=ollama
```

**Required variables:**

For Ollama:
```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434
```

For OpenRouter:
```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-xxxxx
AI_MODEL=anthropic/claude-3.5-sonnet
```

**Validate .env:**
```bash
# Source it and check:
set -a
source .env
set +a
env | grep AI_
```

### Invalid configuration values

**Check AI_PROVIDER is valid:**
```bash
# Must be one of:
AI_PROVIDER=ollama
AI_PROVIDER=openrouter
AI_PROVIDER=anthropic
```

**Check AI_MODEL matches provider:**

Ollama models:
```bash
ollama list
# Use exact name from list
```

OpenRouter models: https://openrouter.ai/models

Anthropic models:
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`

**MPD connection format:**

```bash
# Standard:
MPD_HOST=localhost
MPD_PORT=6600

# With password:
MPD_HOST=mypassword@localhost
MPD_PORT=6600

# Unix socket:
MPD_HOST=/var/run/mpd/socket
```

---

## 10. Library and Queue Problems

### Songs not found

**Update MPD database:**
```bash
mpc update
# Watch progress:
mpc status
```

**Check music directory path:**
```bash
grep music_directory ~/.config/mpd/mpd.conf
# Make sure this points to where your music actually is
```

**Verify files are readable:**
```bash
ls -la ~/Music
# Check permissions - should be readable by your user
```

**Check for symlink issues:**
```bash
# If using symlinks, make sure MPD can follow them:
file ~/Music/*
```

Add to `mpd.conf` if needed:
```conf
follow_outside_symlinks "yes"
follow_inside_symlinks "yes"
```

### Queue not updating

**Check if MPD is responding:**
```bash
mpc status
mpc current
```

**Force queue refresh:**
```bash
mpc clear
mpc add /
mpc shuffle
```

**If queue operations hang:**

Check database size:
```bash
du -sh ~/.config/mpd/database
mpc stats
```

Large libraries (> 50,000 songs) can be slow. Consider:
- Splitting library
- Using faster storage (SSD)
- Increasing MPD connection timeout in Conductor config

### Playlists won't load

**Check playlist directory:**
```bash
ls ~/.config/mpd/playlists/
```

**Playlist format must be .m3u:**
```bash
# Create test playlist:
mpc save test
mpc lsplaylists
```

**Load playlist:**
```bash
mpc load test
mpc playlist
```

If mpc works but Conductor doesn't, file a bug report.

---

## 11. Network Issues

### Proxy configuration

**Set proxy for bun/npm:**
```bash
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

**For API calls (OpenRouter/Anthropic):**

Add to .env:
```bash
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

**For MusicBrainz:**

Conductor should respect system proxy settings. If not working, check:
```bash
env | grep -i proxy
```

### Firewall blocking connections

**Check if ports are blocked:**
```bash
# Test MPD port:
sudo netstat -tuln | grep 6600

# Test Ollama:
curl http://localhost:11434/api/tags

# Test external APIs:
curl -I https://openrouter.ai
curl -I https://musicbrainz.org
```

**Allow through firewall:**
```bash
# UFW (Ubuntu):
sudo ufw allow 6600/tcp

# firewalld (Fedora/CentOS):
sudo firewall-cmd --permanent --add-port=6600/tcp
sudo firewall-cmd --reload

# iptables:
sudo iptables -A INPUT -p tcp --dport 6600 -j ACCEPT
```

### DNS issues

**Test name resolution:**
```bash
nslookup openrouter.ai
nslookup musicbrainz.org
```

**If failing, try different DNS:**
```bash
# Add to /etc/resolv.conf:
nameserver 8.8.8.8
nameserver 8.8.4.4
```

Or use systemd-resolved:
```bash
sudo systemd-resolve --set-dns=8.8.8.8 --interface=eth0
```

---

## 12. Platform-Specific Issues

### Ubuntu/Debian

**MPD PulseAudio issues:**

Install PulseAudio support:
```bash
sudo apt install pulseaudio mpd-pulse
```

Edit `/etc/mpd.conf` or `~/.config/mpd/mpd.conf`:
```conf
audio_output {
    type "pulse"
    name "PulseAudio"
}
```

**Snap/Flatpak isolation:**

If you installed MPD via snap, it may not access your music folder.

Use native package instead:
```bash
sudo snap remove mpd
sudo apt install mpd
```

### Arch Linux

**Missing audio codecs:**
```bash
sudo pacman -S mpd ffmpeg libmad libvorbis flac opus
```

**systemd user service won't start:**
```bash
systemctl --user daemon-reload
systemctl --user enable mpd.service
systemctl --user start mpd.service
```

**Check logs:**
```bash
journalctl --user -u mpd -n 50
```

### Fedora/RHEL

**SELinux issues:**

If getting permission denied errors:
```bash
sudo ausearch -m avc -ts recent | grep mpd
# Check for SELinux denials

# Temporary fix (not recommended for production):
sudo setenforce 0

# Proper fix - create policy:
sudo grep mpd /var/log/audit/audit.log | audit2allow -M mpd-local
sudo semodule -i mpd-local.pp
sudo setenforce 1
```

**Firewall:**
```bash
sudo firewall-cmd --permanent --add-port=6600/tcp
sudo firewall-cmd --reload
```

### WSL (Windows Subsystem for Linux)

**Audio output:**

WSL1 doesn't support audio. Upgrade to WSL2:
```powershell
wsl --set-version Ubuntu 2
```

Then install PulseAudio in Windows and configure PulseAudio TCP in WSL:
```bash
export PULSE_SERVER=tcp:$(grep nameserver /etc/resolv.conf | awk '{print $2}'):4713
```

Add to `~/.bashrc` to persist.

**Or use PipeWire:**
```bash
sudo apt install pipewire pipewire-pulse
```

**X11 forwarding for album art:**

Install VcXsrv or X410 on Windows, then in WSL:
```bash
export DISPLAY=$(grep nameserver /etc/resolv.conf | awk '{print $2}'):0
```

**File permissions:**

Windows files accessed via `/mnt/c/` may have wrong permissions. Copy music to WSL filesystem:
```bash
cp -r /mnt/c/Users/YourName/Music ~/Music
```

### macOS

**Homebrew installation:**
```bash
brew install mpd mpc bun
```

**Audio output for macOS:**

Edit `~/.config/mpd/mpd.conf`:
```conf
audio_output {
    type "osx"
    name "CoreAudio"
}
```

**Überzug++ doesn't work on macOS:**

Use a terminal with built-in image support:
- iTerm2 (with imgcat)
- kitty

Or accept ASCII art fallback.

**Permissions (Catalina+):**

Grant terminal app access to:
- Full Disk Access
- Files and Folders

In System Preferences > Security & Privacy > Privacy

---

## Getting More Help

### Collect diagnostic information

```bash
# System info
uname -a
echo $SHELL
echo $TERM

# MPD info
mpd --version
mpc version
systemctl --user status mpd
mpc status
tail -50 ~/.config/mpd/log

# Conductor info
bun --version
cat .env | grep -v API_KEY  # Don't share API keys
cat ~/.config/mpd/mpd.conf

# AI provider info
# For Ollama:
ollama list
curl http://localhost:11434/api/tags

# Audio info
pactl list sinks | grep -E "Name:|Description:|State:"
```

### Enable debug logging

(Note: This feature may need to be implemented)

```bash
# Set in .env:
DEBUG=true
LOG_LEVEL=debug

# Run and capture logs:
bun start 2>&1 | tee conductor-debug.log
```

### File a bug report

Include:
1. Description of problem
2. Steps to reproduce
3. Expected vs actual behavior
4. Diagnostic output from above
5. Screenshots if relevant

GitHub Issues: https://github.com/shelbeely/Conductor/issues

### Community support

- GitHub Discussions: https://github.com/shelbeely/Conductor/discussions
- Check existing issues: Someone may have already solved your problem

---

## Quick Reference

### Log Locations

- MPD logs: `~/.config/mpd/log`
- MPD config: `~/.config/mpd/mpd.conf`
- Conductor .env: `./Conductor/.env`
- Ollama logs: `journalctl -u ollama -f`
- System logs: `journalctl -xe`

### Essential Commands

```bash
# MPD
mpc status                    # Current status
mpc update                    # Update database
systemctl --user restart mpd  # Restart MPD
tail -f ~/.config/mpd/log    # Watch logs

# Ollama
ollama list                   # List models
ollama ps                     # Show running models
ollama serve                  # Start server
curl http://localhost:11434/api/tags  # Test connection

# Conductor
bun run type-check           # Check types
bun run build                # Build
bun start                    # Run
cat .env                     # Check config

# Audio
pactl list sinks             # List audio devices
pavucontrol                  # GUI mixer
alsamixer                    # CLI mixer

# Network
netstat -tuln | grep 6600    # Check MPD port
curl -I https://openrouter.ai  # Test API
ping -c 1 musicbrainz.org    # Test connectivity
```

### Environment Variables Quick Test

```bash
# Print all config (hides API keys):
env | grep -E "MPD|AI_|OLLAMA|OPENROUTER|ANTHROPIC" | sed 's/\(API_KEY=\).*/\1***/'
```
