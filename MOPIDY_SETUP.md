# Mopidy Setup Guide

Mopidy is a music server that implements the MPD protocol but offers a better plugin ecosystem for streaming services. While it enables YouTube Music, Spotify, and other streaming integrations, it has important limitations compared to MPD.

## ⚠️ Important Limitations

**Mopidy implements an older version of the MPD protocol with missing features:**

- **No album art support** - Mopidy-mpd doesn't support album art commands (see [mopidy/mopidy-mpd#68](https://github.com/mopidy/mopidy-mpd/issues/68))
- **Limited protocol coverage** - Many MPD commands are not implemented or behave differently
- **Metadata gaps** - Some music metadata may be incomplete or missing
- **Performance differences** - May be slower than native MPD for local files

**Consider these tradeoffs:**
- Use Mopidy if you need streaming services (YouTube Music, Spotify, etc.) and can live without album art
- Stick with MPD if you need full protocol support, album art, and maximum performance with local files
- You can run both side-by-side on different ports and switch between them

## Why Mopidy Despite Limitations?

- **Better streaming plugins** - Easy access to YouTube Music, Spotify, SoundCloud, Tidal
- **Python-based** - Simple installation via pip
- **Active plugin ecosystem** - Regular updates for streaming services
- **Cross-platform** - Works on Linux, macOS, Windows

## Installation

### Ubuntu/Debian

```bash
# Add Mopidy repository
sudo mkdir -p /etc/apt/keyrings
wget -q -O /etc/apt/keyrings/mopidy-archive-keyring.gpg https://apt.mopidy.com/mopidy.gpg
wget -q -O /etc/apt/sources.list.d/mopidy.list https://apt.mopidy.com/bullseye.list

# Install Mopidy
sudo apt update
sudo apt install mopidy
```

### Arch Linux

```bash
sudo pacman -S mopidy
```

### macOS

```bash
brew install mopidy
```

### From pip (any platform)

```bash
pip3 install mopidy
```

## YouTube Music Integration

### Install mopidy-ytmusic

```bash
pip3 install mopidy-ytmusic
```

### Setup YouTube Music Authentication

1. **Get authentication headers:**
   
   Option A - Browser extension (recommended):
   - Install "Get cookies.txt LOCALLY" extension for your browser
   - Go to music.youtube.com and log in
   - Click the extension icon and copy the headers

   Option B - Manual:
   - Open music.youtube.com in your browser
   - Open Developer Tools (F12)
   - Go to Network tab
   - Refresh the page
   - Click any request to music.youtube.com
   - Copy the request headers

2. **Configure mopidy-ytmusic:**

   Create or edit `~/.config/mopidy/mopidy.conf`:

   ```ini
   [ytmusic]
   enabled = true
   # Optional: Use OAuth (easier, recommended)
   auth_json = /path/to/oauth.json
   
   # Or use headers.txt method
   # headers = /path/to/headers.txt
   ```

3. **Run OAuth setup (recommended method):**

   ```bash
   mopidy-ytmusic setup
   ```

   This opens a browser window to authenticate with Google. The credentials are saved to `oauth.json`.

### YouTube Music Features

With mopidy-ytmusic, you get:
- **Your library** - Uploaded songs, liked songs, playlists
- **Search** - Full YouTube Music catalog
- **Recommendations** - AI-generated playlists and mixes
- **Albums and artists** - Browse complete discographies
- **Free tier** - Works without YouTube Music Premium (with ads)
- **Premium tier** - Ad-free, background playback, offline support

## Other Streaming Services

### Spotify

```bash
pip3 install mopidy-spotify
```

Configure in `mopidy.conf`:

```ini
[spotify]
enabled = true
username = YOUR_SPOTIFY_USERNAME
password = YOUR_SPOTIFY_PASSWORD
client_id = YOUR_SPOTIFY_CLIENT_ID
client_secret = YOUR_SPOTIFY_CLIENT_SECRET
```

Get credentials at https://developer.spotify.com/dashboard

### SoundCloud

```bash
pip3 install mopidy-soundcloud
```

Configure in `mopidy.conf`:

```ini
[soundcloud]
enabled = true
auth_token = YOUR_SOUNDCLOUD_AUTH_TOKEN
```

### Tidal

```bash
pip3 install mopidy-tidal
```

Configure in `mopidy.conf`:

```ini
[tidal]
enabled = true
quality = LOSSLESS
username = YOUR_TIDAL_USERNAME
password = YOUR_TIDAL_PASSWORD
```

## Basic Mopidy Configuration

Create `~/.config/mopidy/mopidy.conf`:

```ini
[core]
cache_dir = ~/.cache/mopidy
config_dir = ~/.config/mopidy
data_dir = ~/.local/share/mopidy

[audio]
output = autoaudiosink

[mpd]
enabled = true
hostname = 127.0.0.1
port = 6600
max_connections = 20

[http]
enabled = true
hostname = 127.0.0.1
port = 6680

[file]
enabled = true
media_dirs = 
    ~/Music|Music

[ytmusic]
enabled = true
auth_json = ~/.config/mopidy/ytmusic-oauth.json
```

## Running Mopidy

### Start Mopidy

```bash
mopidy
```

### Run as systemd service

```bash
# Enable user service
systemctl --user enable mopidy
systemctl --user start mopidy

# Check status
systemctl --user status mopidy
```

### Check logs

```bash
journalctl --user -u mopidy -f
```

## Using Conductor with Mopidy

Conductor connects to Mopidy the same way it connects to MPD. Most features work, but some limitations apply.

### What Works

✅ Playback control (play, pause, skip, seek)
✅ Queue management (add, remove, reorder)
✅ Library browsing and search
✅ Playlists
✅ Volume control
✅ Track metadata (title, artist, album)
✅ AI features (DJ hosts, Beyond the Beat, lyrics)
✅ Natural language commands

### What Doesn't Work

❌ Album art display (protocol limitation)
❌ Some advanced MPD commands
❌ Certain metadata fields may be incomplete

### Environment Variables

Make sure your `.env` has:

```bash
MPD_HOST=localhost
MPD_PORT=6600
```

### Start Using

1. Start Mopidy: `mopidy`
2. Start Conductor: `npm start`
3. Use natural language commands:
   - "play some jazz from YouTube Music"
   - "search for Radiohead on YouTube"
   - "play my liked songs"
   - "add this to my playlist"

**Note:** Album art features in Conductor will not work with Mopidy due to protocol limitations.

## Migrating from MPD to Mopidy

### Deciding Between MPD and Mopidy

**Use MPD if:**
- You primarily play local music files
- You need full album art support
- You want maximum performance and protocol coverage
- You need complete metadata support

**Use Mopidy if:**
- You need streaming services (YouTube Music, Spotify, etc.)
- You can live without album art in the TUI
- You want easier plugin management
- You primarily stream rather than play local files

### Keep MPD database

Mopidy can read your existing MPD database:

```ini
[file]
media_dirs = /path/to/your/music
```

### Run both simultaneously (Recommended)

The best approach is to run both MPD and Mopidy on different ports:

**MPD setup:**
- Port 6600 (default)
- For local music + full features

**Mopidy setup:**
- Port 6601
- For streaming services

Configure Mopidy:

```ini
[mpd]
port = 6601
```

**Switch between them in Conductor:**
- Local music: `MPD_PORT=6600`
- Streaming: `MPD_PORT=6601`

Or create shell aliases:
```bash
alias conductor-local='MPD_PORT=6600 npm start'
alias conductor-stream='MPD_PORT=6601 npm start'
```

### Full migration (Not Recommended)

Only if you don't need album art or full MPD features:

1. Stop MPD: `systemctl --user stop mpd`
2. Start Mopidy: `systemctl --user start mopidy`
3. Point Conductor to port 6600 (Mopidy's default)

**Warning:** You'll lose album art and some MPD features.

## Troubleshooting

### Album art not showing

This is a known limitation. Mopidy's MPD implementation doesn't support album art commands. See [mopidy/mopidy-mpd#68](https://github.com/mopidy/mopidy-mpd/issues/68).

**Workaround:** Run MPD alongside Mopidy on a different port for local music with album art support.

### YouTube Music authentication fails

- Clear browser cookies and try OAuth setup again
- Use headers.txt method instead of OAuth
- Check mopidy logs: `journalctl --user -u mopidy -f`

### No audio output

```ini
[audio]
output = alsasink
# Or
output = pulsesink
```

### Library not updating

```bash
# Trigger library scan
mpc update
```

### Plugin not loading

Check Mopidy extensions:

```bash
mopidy config
```

Look for your plugin in the output. If missing, reinstall:

```bash
pip3 install --upgrade mopidy-ytmusic
```

### Metadata incomplete or missing

Some streaming services don't provide complete metadata. This is a limitation of the service's API, not Mopidy.

## Advanced Configuration

### Multiple audio outputs

```ini
[audio]
output = tee name=t ! queue ! pulsesink t. ! queue ! lamemp3enc ! shout2send mount=stream.mp3
```

### Proxy support

```ini
[proxy]
hostname = proxy.example.com
port = 8080
```

### Auto-start on boot

```bash
systemctl --user enable mopidy
```

## Performance Tips

1. **Use SSD for cache** - Speeds up library scanning
2. **Increase cache size** - Edit `mopidy.conf`:
   ```ini
   [ytmusic]
   cache_duration = 7
   ```
3. **Enable gapless playback**:
   ```ini
   [audio]
   buffer_time = 5000
   ```

## Resources

- [Mopidy Documentation](https://docs.mopidy.com/)
- [mopidy-ytmusic GitHub](https://github.com/OzymandiasTheGreat/mopidy-ytmusic)
- [Available Mopidy Extensions](https://mopidy.com/ext/)
- [Mopidy Discord](https://discord.gg/mopidy)

## Security Notes

- **OAuth tokens** - Store `oauth.json` securely, don't commit to git
- **API keys** - Keep credentials in `mopidy.conf`, restrict file permissions:
  ```bash
  chmod 600 ~/.config/mopidy/mopidy.conf
  ```
- **Network exposure** - By default, Mopidy only listens on localhost
- **Firewall** - Don't expose Mopidy ports to the internet without authentication

## Getting Help

If you run into issues:

1. Check Mopidy logs: `journalctl --user -u mopidy -f`
2. Verify configuration: `mopidy config`
3. Test connection: `mpc -h localhost -p 6600 status`
4. Visit the Mopidy Discord or GitHub issues for plugin-specific problems

Mopidy makes it easy to bring YouTube Music, Spotify, and other services into Conductor's AI-powered music experience.
