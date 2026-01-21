# Security considerations

This document covers security practices for Conductor. While it's a local music player, it handles API keys and network connections that need protection.

## API key security

**Storage location:**

API keys live in your `.env` file, which git ignores by default. Never commit this file to version control.

```bash
# .env (never commit this)
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...
```

The `.gitignore` file already excludes `.env`, but double-check before pushing:

```bash
git status  # .env should NOT appear here
```

**File permissions:**

Your `.env` file should be readable only by you:

```bash
chmod 600 .env
ls -l .env
# Should show: -rw------- (600)
```

If others share your system, this prevents them from reading your keys.

**Key rotation:**

If you accidentally expose an API key:

1. Revoke it immediately through the provider's dashboard
2. Generate a new key
3. Update your `.env` file
4. Check if the exposed key was used (provider dashboards show usage)

OpenRouter: https://openrouter.ai/keys
Anthropic: https://console.anthropic.com/settings/keys

**Environment variables in production:**

When running Conductor on a server or shared system, set environment variables directly instead of using a file:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export AI_PROVIDER="openrouter"
bun start
```

These environment variables exist only in your shell session and aren't stored on disk.

**Avoid logging keys:**

The code doesn't log API keys, but be careful if you add debug output. Never print `process.env.OPENROUTER_API_KEY` or similar.

## Network security

**MPD connections:**

By default, Conductor connects to `localhost:6600`. This is safe because it stays on your machine.

If you expose MPD to the network:

```conf
# In ~/.config/mpd/mpd.conf
bind_to_address "0.0.0.0"  # Allows remote connections
```

Anyone on your network can control your music. MPD has no built-in authentication. Secure it with:

1. **Firewall rules** - Allow only trusted IPs:
   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 6600
   ```

2. **SSH tunneling** - Access remote MPD through SSH:
   ```bash
   ssh -L 6600:localhost:6600 user@remotehost
   # Conductor connects to localhost:6600 as usual
   ```

3. **VPN** - Put MPD behind a VPN like WireGuard so only VPN clients can reach it

**AI provider connections:**

OpenRouter and Anthropic use HTTPS with TLS 1.3. Your API keys travel encrypted.

Ollama runs locally by default (`http://localhost:11434`). If you expose it to the network, anyone can use your Ollama instance. Same firewall advice applies.

**MusicBrainz API:**

Conductor queries MusicBrainz over HTTPS. No credentials needed. The requests include user agent strings identifying Conductor but no personal information.

**Album art downloads:**

Cover images come from the Cover Art Archive (HTTPS). These are just image files. No security risk beyond standard image parsing, which the terminal handles.

## File permissions

**Configuration directory:**

If Conductor creates a config directory (e.g., `~/.config/conductor`), set appropriate permissions:

```bash
chmod 700 ~/.config/conductor
```

This makes it readable only by you.

**Cache directory:**

Album art and metadata cache might live in `~/.cache/conductor`. These are public data (cover images, artist names), so permissions matter less. But keeping them private prevents others from seeing your listening history.

```bash
chmod 700 ~/.cache/conductor
```

**Music library:**

Your music files (`~/Music` or wherever MPD points) should have appropriate permissions. Most users run:

```bash
chmod 755 ~/Music          # Readable by everyone
chmod 644 ~/Music/**/*.mp3 # Files readable by everyone
```

If your music is private:

```bash
chmod 700 ~/Music          # Only you can read
chmod 600 ~/Music/**/*.mp3 # Only you can read files
```

MPD runs as your user by default, so it can read whatever you can read.

**Log files:**

MPD logs live in `~/.config/mpd/log` or similar. These might include file paths and track names. If that's sensitive:

```bash
chmod 600 ~/.config/mpd/log
```

Conductor doesn't create log files by default. If you redirect output:

```bash
bun start > conductor.log 2>&1
```

Make sure the log file has proper permissions:

```bash
chmod 600 conductor.log
```

## Secure configuration

**Minimal AI permissions:**

API keys for OpenRouter and Anthropic have full account access. There's no way to limit them to just Conductor.

Monitor usage through provider dashboards. If you see unexpected activity, rotate your keys.

**MPD password protection:**

MPD supports passwords in `mpd.conf`:

```conf
password "my_password@read,add,control,admin"
```

Connect using:

```bash
MPD_HOST=password@localhost
```

Set this in your `.env`:

```bash
MPD_HOST=password@localhost
MPD_PORT=6600
```

This adds a layer of protection if MPD is exposed to the network.

**Disabling remote features:**

If you only use Conductor locally with Ollama:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
MPD_HOST=localhost
MPD_PORT=6600
```

Nothing touches the internet except MusicBrainz queries, which are read-only and harmless.

To disable MusicBrainz (not currently a config option, requires code change), you'd need to modify `src/metadata/musicbrainz.ts` to skip API calls. Or just block outbound connections to `musicbrainz.org` with your firewall.

## Threat model

**What Conductor protects:**

- API keys stay on your machine (not sent anywhere except to their respective providers)
- Music playback is local (no streaming to external services)
- Command history stays in memory (cleared when you exit)

**What Conductor doesn't protect:**

- If someone gains shell access to your machine, they can read your `.env` file
- MPD has no authentication by default
- Your music library is as secure as your filesystem permissions
- AI providers see your commands (they know you're playing music, what you search for, etc.)

**Privacy with cloud AI:**

OpenRouter and Anthropic see your natural language commands. This includes track names, artists, and genres you search for.

If that's a concern, use Ollama instead. Everything stays local.

**Privacy with local AI:**

Ollama models run entirely on your machine. No data leaves your computer except MusicBrainz metadata lookups and album art downloads.

## Security checklist

Before running Conductor in any shared or production environment:

- [ ] `.env` file has permissions 600
- [ ] API keys are valid and not exposed in git history
- [ ] MPD is bound to localhost unless you need remote access
- [ ] If remote MPD access is needed, it's protected by firewall or SSH tunnel
- [ ] Ollama (if used) is bound to localhost unless you need remote access
- [ ] Music library has appropriate permissions
- [ ] No API keys in log files or debug output
- [ ] You understand what data goes to AI providers (commands, search terms)

## Secure deployment

If you run Conductor on a server:

1. **Use systemd user service** (covered in DEPLOYMENT.md)
2. **Set environment variables** in the systemd unit file instead of `.env`
3. **Restrict SSH access** to the server
4. **Keep bun.js and dependencies updated** (`bun update`)
5. **Monitor API key usage** through provider dashboards
6. **Use local Ollama** if you don't want cloud AI seeing your commands

## Reporting security issues

If you find a security vulnerability in Conductor:

1. **Don't open a public issue** (this exposes the vulnerability)
2. **Email the maintainer** with details (check README for contact info)
3. **Include steps to reproduce** the issue
4. **Give time for a fix** before disclosing publicly

Common sense stuff. The project is small enough that security issues are unlikely, but report them responsibly if you find any.

## Dependencies

Conductor's security depends on its dependencies:

- **bun.js** - Keep updated
- **mpc-js** (MPD client) - Mature library, rarely updated
- **Ink** (React for CLI) - Maintained by Vercel
- **Zod** (schema validation) - Widely used, well-maintained

Check for outdated dependencies:

```bash
bun outdated
```

Update when needed:

```bash
bun update
```

The `package.json` uses exact versions (no `^` or `~`), so updates are explicit. This prevents surprise breakage but means you need to update manually.

## Summary

Key security practices:

1. Protect your `.env` file (permissions 600, never commit)
2. Keep MPD and Ollama bound to localhost unless you need remote access
3. Use SSH tunnels or VPN for remote access instead of exposing services
4. Understand that cloud AI providers see your commands
5. Keep dependencies updated
6. Monitor API key usage

Conductor is a local music player. Its attack surface is small. Follow basic security hygiene and you'll be fine.
