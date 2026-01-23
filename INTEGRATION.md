# Integration guide

Conductor works as a standalone music player, but it can integrate with other services and tools. This guide covers current integrations and potential future ones.

## Last.fm scrobbling

Last.fm tracks your listening history. Conductor doesn't have built-in scrobbling, but MPD supports it through `mpdscribble`.

**Installation:**

```bash
# Debian/Ubuntu
sudo apt install mpdscribble

# Arch Linux
sudo pacman -S mpdscribble
```

**Configuration:**

Edit `~/.mpdscribble/mpdscribble.conf` or `/etc/mpdscribble.conf`:

```conf
[mpdscribble]
host = localhost
port = 6600

[last.fm]
url = https://post.audioscrobbler.com/
username = your_lastfm_username
password = your_lastfm_password
# Or use password_command for security
```

Start the service:

```bash
# User service
systemctl --user enable mpdscribble
systemctl --user start mpdscribble

# Or run manually
mpdscribble --conf ~/.mpdscribble/mpdscribble.conf
```

Now everything you play through Conductor gets scrobbled to Last.fm automatically.

**Libre.fm alternative:**

Libre.fm is an open-source Last.fm alternative. Same setup, different URL:

```conf
[libre.fm]
url = https://libre.fm/api/scrobble
username = your_librefm_username
password = your_librefm_password
```

**ListenBrainz:**

MusicBrainz's listening tracking service. Use `listenbrainz-mpd` instead of `mpdscribble`:

```bash
# Install from source or package manager
git clone https://github.com/InputUsername/listenbrainz-mpd.git
cd listenbrainz-mpd
cargo install --path .

# Configure
listenbrainz-mpd --config-template > ~/.config/listenbrainz-mpd/config.toml
```

Edit the config with your ListenBrainz token.

## Discord rich presence

Show your current track in Discord using `mpd-discord-rpc`.

**Installation:**

```bash
# Via cargo
cargo install mpd-discord-rpc

# Or download binary from releases
```

**Configuration:**

Create `~/.config/mpd-discord-rpc/config.toml`:

```toml
[mpd]
host = "localhost"
port = 6600

[discord]
app_id = "your_discord_app_id"  # Get from Discord Developer Portal

[format]
details = "{title}"
state = "{artist} - {album}"
large_image = "mpd"
large_text = "Music Player Daemon"
```

**Getting a Discord app ID:**

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "Music Player" or whatever
4. Copy the Application ID
5. Paste it into the config

**Running:**

```bash
mpd-discord-rpc
```

Run it in the background or add it to your startup scripts.

Your Discord profile now shows what you're listening to in Conductor.

## Web APIs

Conductor doesn't expose an API, but MPD has an HTTP output plugin that streams audio to browsers.

**MPD HTTP output:**

Add to `~/.config/mpd/mpd.conf`:

```conf
audio_output {
    type        "httpd"
    name        "HTTP Stream"
    encoder     "lame"  # or "vorbis", "opus"
    port        "8000"
    bitrate     "192"
    format      "44100:16:2"
    always_on   "yes"
}
```

Restart MPD:

```bash
systemctl --user restart mpd
```

Now you can stream from `http://localhost:8000/mpd.mp3` in any browser or audio player. Control playback with Conductor, listen anywhere on your network.

**Web interface:**

MPD web clients like ympd, myMPD, or RompR provide browser-based control:

```bash
# Install ympd
sudo apt install ympd

# Or myMPD (more modern)
git clone https://github.com/jcorporation/myMPD.git
cd myMPD
./build.sh release
```

Access at `http://localhost:8080`. Control the same MPD instance that Conductor uses.

## Other music tools

**ncmpcpp (terminal client):**

Traditional MPD client with a different interface:

```bash
sudo apt install ncmpcpp
ncmpcpp
```

You can run both Conductor and ncmpcpp simultaneously. They control the same MPD daemon. Use ncmpcpp for detailed library browsing, Conductor for natural language control.

**Cantata (GUI client):**

Desktop MPD client if you prefer GUIs:

```bash
sudo apt install cantata
cantata
```

Same deal - it controls the same MPD instance as Conductor.

**beets (music library manager):**

Tag and organize your library:

```bash
pip install beets
beet import ~/Music
```

After importing, beets writes proper tags to your files. MPD picks up the changes next time you update:

```bash
mpc update
```

Conductor benefits from better-tagged music.

**MusicBrainz Picard (tagger):**

GUI tool for tagging:

```bash
sudo apt install picard
picard
```

Load your music, look up on MusicBrainz, save tags. Update MPD database afterward.

**Syncthing (sync music across devices):**

Sync your music library between computers:

```bash
sudo apt install syncthing
systemctl --user enable syncthing
systemctl --user start syncthing
```

Set up folder sync for `~/Music`. Now your library stays synchronized across machines. Run Conductor on any of them.

## Smart home integration

**Home Assistant:**

MPD has a Home Assistant integration. Add to `configuration.yaml`:

```yaml
media_player:
  - platform: mpd
    host: localhost
    port: 6600
```

Control Conductor's playback through Home Assistant automations:

```yaml
automation:
  - alias: "Play music when I get home"
    trigger:
      platform: state
      entity_id: person.me
      to: 'home'
    action:
      service: media_player.play_media
      target:
        entity_id: media_player.mpd
      data:
        media_content_type: playlist
        media_content_id: "Welcome Home"
```

**Voice assistants:**

Use Home Assistant with voice integration (Rhasspy, Mycroft, Home Assistant Cloud) to control Conductor via voice.

Or connect MPD directly to voice assistants using MQTT bridges and custom commands.

## Development integrations

**Language Server Protocol (LSP):**

If you're developing Conductor, use TypeScript's language server:

```bash
# Already configured in the project
bun run type-check
```

VSCode and other editors pick this up automatically.

**GitHub Actions:**

The project can use GitHub Actions for CI:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run type-check
      - run: bun run build
```

This runs type checks and builds on every push.

**Pre-commit hooks:**

Automate checks before committing:

```bash
# .git/hooks/pre-commit
#!/bin/bash
bun run type-check || exit 1
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Scripting and automation

**Shell scripts:**

Control Conductor's MPD instance from shell scripts:

```bash
#!/bin/bash
# Morning music routine

# Clear queue
mpc clear

# Load morning playlist
mpc load "Morning Mix"

# Set volume
mpc volume 40

# Start playing
mpc play

# Show what's playing
mpc status
```

Combine with cron for scheduled playback:

```bash
# crontab -e
0 7 * * * /home/user/scripts/morning-music.sh
```

**Python integration:**

Use python-mpd2 to control MPD from Python:

```python
from mpd import MPDClient

client = MPDClient()
client.connect("localhost", 6600)

# Add tracks
client.add("jazz/miles_davis")

# Start playback
client.play()

# Get current track
current = client.currentsong()
print(f"Playing: {current['title']} by {current['artist']}")

client.disconnect()
```

Build custom scripts or bots that interact with the same MPD instance Conductor uses.

**Node.js integration:**

The `mpd2` npm package does the same from Node:

```javascript
import MPD from 'mpd2';

const mpd = await MPD.connect({ host: 'localhost', port: 6600 });

await mpd.playlistInfo();
await mpd.play();
await mpd.next();

mpd.disconnect();
```

## Notification integrations

**Desktop notifications:**

Show notifications when tracks change using `mpd-notification`:

```bash
# Install
sudo apt install mpd-notification

# Or build from source
git clone https://github.com/vehk/mpd-notification.git
cd mpd-notification
make
```

Configure `~/.config/mpd-notification.conf`:

```conf
host = localhost
port = 6600
notification_timeout = 5000
cover_size = 128
```

Run it:

```bash
mpd-notification
```

Now you get desktop notifications with album art when tracks change.

**Terminal notifications:**

Send notifications to your terminal:

```bash
#!/bin/bash
# Watch for track changes

mpc idle player | while read -r event; do
  current=$(mpc current)
  echo "Now playing: $current"
done
```

Run this in a separate terminal or tmux pane.

## Remote access

**SSH tunneling:**

Access Conductor from another machine:

```bash
# From remote machine
ssh -L 6600:localhost:6600 user@homeserver

# Now connect to localhost:6600 as if MPD were local
```

Run Conductor on the remote machine, control the local MPD instance.

**Reverse SSH tunnel:**

Make your local MPD accessible from a remote server:

```bash
# From local machine
ssh -R 6600:localhost:6600 user@remoteserver

# On remote server, connect to localhost:6600
```

**VPN access:**

Set up WireGuard or OpenVPN. Your devices share a private network. Connect to the MPD server's VPN IP.

## Streaming services (future integration)

Conductor currently works with local files only. Future versions might integrate:

**Spotify via spotifyd:**

spotifyd is a Spotify daemon that works like MPD:

```bash
# Install spotifyd
sudo apt install spotifyd

# Configure with your Spotify credentials
```

You could theoretically bridge spotifyd and MPD, but this isn't well-supported yet.

**Subsonic/Airsonic:**

Self-hosted music streaming. MPD has plugins for Subsonic servers:

```conf
# mpd.conf
audio_output {
    type        "httpd"
    name        "Subsonic Stream"
}
```

This area needs more development work.

## Export and backup

**Exporting playlists:**

MPD playlists are plain text files in `~/.config/mpd/playlists/`:

```bash
cat ~/.config/mpd/playlists/MyPlaylist.m3u
```

Copy these to back up your playlists.

**Database backup:**

MPD's database lives in `~/.config/mpd/database`. Back it up:

```bash
cp ~/.config/mpd/database ~/.config/mpd/database.backup
```

Or just let MPD regenerate it:

```bash
mpc update
```

**Config backup:**

Back up your Conductor config:

```bash
cp .env .env.backup
```

Store your API keys securely (password manager, encrypted backup).

## Creating your own integrations

**MPD protocol:**

Read the MPD protocol documentation: https://mpd.readthedocs.io/en/stable/protocol.html

Connect via TCP to `localhost:6600` and send commands:

```bash
telnet localhost 6600
status
currentsong
```

Build integrations in any language that supports TCP sockets.

**Conductor tool extensions:**

Add new tools to `src/ai/agent.ts`:

```typescript
export const CustomToolSchema = z.object({
  param: z.string().describe('Parameter description'),
});

export const tools = [
  // ... existing tools
  {
    name: 'custom_tool',
    description: 'What this tool does',
    schema: CustomToolSchema,
  },
];
```

Implement the handler in `src/App.tsx`:

```typescript
case 'custom_tool':
  // Your implementation
  break;
```

This lets the AI use your custom functionality.

**MusicBrainz extensions:**

Conductor's MusicBrainz client lives in `src/metadata/musicbrainz.ts`. Extend it to fetch additional data (lyrics, reviews, related artists).

**Album art sources:**

Current implementation uses Cover Art Archive. Add other sources by modifying `src/art/display.ts` to check multiple APIs.

## Platform-specific integrations

**Linux systemd:**

Integrate with systemd for auto-start and logging (covered in DEPLOYMENT.md).

**macOS launchd:**

Create a LaunchAgent plist for macOS auto-start:

```xml
<!-- ~/Library/LaunchAgents/com.conductor.player.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.conductor.player</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/bun</string>
        <string>start</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/you/Conductor</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.conductor.player.plist
```

**Windows WSL:**

Conductor works in WSL. MPD runs in the WSL environment, audio outputs to Windows:

```conf
# mpd.conf
audio_output {
    type    "pulse"
    name    "PulseAudio"
}
```

WSL2 supports PulseAudio, so audio plays through Windows.

## Summary

Conductor integrates with:

- **Scrobbling:** Last.fm, Libre.fm, ListenBrainz via mpdscribble or similar
- **Discord:** Rich presence via mpd-discord-rpc
- **Web:** HTTP streaming via MPD, web clients like myMPD
- **Other MPD clients:** ncmpcpp, Cantata, etc. (simultaneous use)
- **Tagging tools:** beets, MusicBrainz Picard
- **Smart home:** Home Assistant, voice assistants via MQTT
- **Notifications:** Desktop notifications via mpd-notification
- **Remote access:** SSH tunneling, VPN
- **Scripting:** Shell, Python, Node.js via MPD protocol

Most integrations happen at the MPD level. Conductor benefits from anything that works with MPD.
