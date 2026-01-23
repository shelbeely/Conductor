# Conductor FAQ

## General

### What is Conductor?

A TUI music player for Linux that controls MPD (Music Player Daemon) using natural language commands. Instead of memorizing keyboard shortcuts or MPD commands, you just type what you want: "play some jazz", "skip to the next track", "turn up the volume".

### Why would I use this instead of a regular MPD client?

Most MPD clients make you learn their specific interface and shortcuts. Conductor lets you control your music the way you think about it. Plus, if you already run MPD for other reasons, this adds an AI-powered interface on top without replacing your existing setup.

### Who is this for?

Linux users who live in the terminal and already use (or want to use) MPD. If you prefer typing to clicking, and you like the idea of controlling music with plain English instead of memorizing keybindings, give it a shot.

### Does it replace MPD or work with it?

Works with it. You need MPD running - Conductor is just a frontend. You can use other MPD clients at the same time if you want.

### Can I use this on a headless server?

Yes, that's one of the better use cases. SSH into your server, run Conductor, control music on your home stereo or speakers connected to that machine.

### Why "Conductor"?

Because it conducts your music player. That's it.

## Installation and setup

### What do I need before installing?

MPD installed and configured with your music library. Either bun.js (1.0+) or Node.js (18+). An AI provider - either Ollama running locally, or an API key for OpenRouter/Anthropic.

### How long does installation take?

10-15 minutes if MPD is already set up. Closer to 30 minutes if you're starting from scratch and need to configure MPD and download an Ollama model.

### What's the recommended setup?

Depends on your priorities. For privacy and offline use: Ollama with llama3.2. For better AI responses: OpenRouter with Claude 3.5 Sonnet. For cost: Ollama is free, OpenRouter costs maybe $0.50-2/month with normal use.

### Do I need root access?

Not for Conductor itself. You might need it to install MPD or bun.js via your package manager, but that's about it.

### Can I install this without bun.js?

Yes, it works with Node.js 18+. The code uses standard Node APIs, bun.js is just faster and the recommended runtime.

### Which Linux distros are supported?

Anything that can run MPD, bun/Node, and has a terminal. Tested on Ubuntu, Arch, and Debian. Should work on Fedora, openSUSE, etc.

### What if my distro doesn't have bun.js packaged?

Install it from their website with `curl -fsSL https://bun.sh/install | bash`. Takes 30 seconds, doesn't need root.

## AI and natural language

### How does the AI actually work?

You type a command. The AI processes it and decides which "tools" to call - things like search_music, play_music, set_volume. Those tools translate to actual MPD commands. The response comes back and shows up in the UI.

### Which AI provider is best?

Claude 3.5 Sonnet via OpenRouter gives the most accurate results. Llama3.2 via Ollama is free and works offline but occasionally misunderstands complex requests.

### Can I use this completely offline?

Yes, with Ollama. You'll lose MusicBrainz metadata enrichment (artist bios, album info) unless you cache everything first, but basic playback and control work fine.

### What if the AI misunderstands my command?

It happens. Try rephrasing or being more specific. "Play that one song" probably won't work, but "play Blue in Green by Miles Davis" will.

### Does it learn from my corrections?

Not yet. Each command is processed independently. Conversation history is tracked within a session but not persisted between runs.

### Can I disable AI and use it like a normal MPD client?

Not really. The whole interface is built around natural language input. If you want a traditional MPD client, there are better options (ncmpcpp, mpc, etc.).

### How much does API usage cost?

With OpenRouter and Claude 3.5 Sonnet, probably $0.50-2/month for regular use (say, 50-100 commands a day). Ollama is free but uses your CPU/GPU.

## MPD integration

### Why does this require MPD instead of playing files directly?

MPD handles the actual audio playback, library management, and queue. Conductor is just a control interface. This keeps the architecture clean and lets you use other MPD clients simultaneously.

### Can I use a different music player?

No, it's built specifically for MPD. The entire codebase assumes MPD's protocol and features.

### What if MPD is on a different machine?

Set `MPD_HOST` and `MPD_PORT` in your `.env` file to point at it. Works fine over the network, though latency in the TUI updates depends on your connection.

### Does it work with music streaming services?

Only if MPD does. MPD has some support for streaming (HTTP streams, cloud storage), but Conductor doesn't add anything special for Spotify, Apple Music, etc.

### Can I control multiple MPD servers?

Not currently. You'd need to run separate instances of Conductor with different `.env` configs.

### What happens if MPD crashes while Conductor is running?

It'll show an error and try to reconnect. Once MPD is back up, Conductor should reconnect automatically.

## Features and limitations

### What audio formats does it support?

Whatever MPD supports: MP3, FLAC, OGG, AAC, WAV, and more. Check MPD's documentation for the full list.

### Can I create and manage playlists?

Basic viewing, yes. Creating and editing playlists through natural language isn't implemented yet. You can still use `mpc` or another client for that.

### Does it have playlist support?

It shows the current queue and lets you add/remove/clear, but saved playlists aren't a first-class feature yet.

### Can I control it remotely?

Only through SSH if you're running it on a server. There's no web interface or mobile app.

### Is there a GUI version?

No, it's terminal-only. That's the whole point.

### Does it show lyrics?

Not yet. Would be a good addition.

### Can I see a history of what I've played?

Not currently. MPD tracks some of this in its state file, but Conductor doesn't expose it.

### Does it support radio streams?

If MPD can play them, yes. Use "add [stream URL] to queue" or similar.

### Can I rate songs or build smart playlists?

No. Those features aren't implemented.

## Performance

### How much RAM does it use?

Around 50-100 MB for the Node/bun process. Ollama uses significantly more (1-8 GB depending on the model).

### Will it work with large music libraries?

MPD handles the library, so that's on MPD's performance. Searching for music in a 50,000+ track library works fine, though the AI might take a second to process complex queries.

### How fast are the AI responses?

Local Ollama: 1-3 seconds on decent hardware. OpenRouter: usually under 1 second. Anthropic direct: also around 1 second.

### Does it slow down after running for a while?

Shouldn't. If it does, that's a bug (or you're running out of RAM because Ollama is eating it).

### Can I run this on a Raspberry Pi?

Probably? MPD and Node.js work on Pi. Ollama might be too heavy depending on the model. OpenRouter would work fine since the AI runs remotely.

## Privacy and security

### What data gets sent to AI providers?

Your commands ("play some jazz") and some context about what's in your library when searching. Track metadata like titles, artists, albums. That's it.

### Does it upload my music files?

No. Only text - command history and music metadata.

### Are my API keys secure?

They're stored in `.env` which should not be committed to git (there's a `.gitignore` for this). Don't paste your `.env` file in public places.

### Can I use it without any network access?

Yes, with Ollama for AI and assuming your music is local. You won't get MusicBrainz metadata or album art from remote sources.

### Does MusicBrainz track what I listen to?

No, the app only queries for metadata (artist info, album art). It doesn't report what you're playing.

### Is there telemetry or analytics?

No. The app doesn't phone home.

## Compatibility

### Does it work on macOS?

MPD works on macOS, so technically yes. But it's built and tested primarily for Linux. Album art via Überzug++ won't work on macOS.

### What about WSL (Windows Subsystem for Linux)?

Should work, though audio output through MPD in WSL can be tricky. Überzug++ probably won't work. You might need to run MPD on Windows itself and point WSL Conductor at it.

### Does it work on Windows natively?

No. MPD exists for Windows, but the app assumes a Unix-like environment.

### Which terminal emulators work best?

Any modern one. Kitty, Alacritty, and urxvt support Überzug++ for album art. Others will fall back to ASCII art.

### Does it work over SSH?

Yes, but album art won't display unless you're using X11 forwarding and a compatible terminal. ASCII fallback works fine.

### Does it require X11 or Wayland?

For Überzug++ album art, yes. The TUI itself works in a pure console (no graphics server needed).

## Customization

### Can I change the theme or colors?

Not yet. It uses Ink's default rendering. You could modify the source code, but there's no configuration-based theming.

### Are there plugins or extensions?

No. The architecture could support them (see ARCHITECTURE.md), but nothing's implemented.

### Can I add custom AI commands?

You'd need to modify `src/ai/agent.ts` to add new tool schemas and implement handlers in `src/App.tsx`. It's doable but requires TypeScript knowledge.

### Can I use a different AI model?

Yes. Set `AI_MODEL` in `.env` to any model your provider supports. For Ollama, pull the model first with `ollama pull <model>`.

### How do I change the update polling rate?

Edit `src/App.tsx` and change the interval in `setInterval` (default is 1000ms). Rebuild with `bun run build`.

## Comparison

### How is this different from ncmpcpp?

ncmpcpp is a traditional TUI with keyboard navigation and shortcuts. Conductor uses natural language. ncmpcpp is more feature-complete and mature; Conductor is more experimental and easier to use if you don't want to learn shortcuts.

### What about mpc?

mpc is a command-line tool, not an interactive TUI. You'd use mpc in shell scripts or as individual commands. Conductor gives you a persistent interface with AI assistance.

### How does it compare to GUI players like Rhythmbox or Clementine?

Completely different use case. Those are full-featured desktop apps with library management, visualization, streaming services, etc. Conductor is minimal, terminal-based, and AI-focused.

### Why not just use Spotify in a browser?

Different audiences. Spotify is a streaming service; Conductor is for local libraries managed by MPD. If you use Spotify, you probably don't need this.

### Is there anything else like this?

Not really. There are AI music recommendation engines and voice assistants that control streaming services, but a TUI MPD client with local AI is pretty niche.

## Contributing and development

### How can I contribute?

Check CONTRIBUTING.md. Issues and pull requests are welcome. The codebase is small enough that you can read through it in an hour or two.

### What's on the roadmap?

No formal roadmap. Things that would be nice: better playlist management, lyrics display, Last.fm scrobbling, theme system, plugin architecture.

### How do I report bugs?

Open an issue on GitHub with details about your setup (Linux distro, MPD version, AI provider, bun/Node version) and what went wrong.

### Can I help without knowing TypeScript?

Sure - documentation improvements, testing on different distros, reporting bugs, suggesting features.

### Is this actively maintained?

It's a side project. Updates happen when they happen. If it stops working with a new MPD or bun.js version, someone will probably fix it.

### Can I fork this for my own weird use case?

Yes, MIT license. Go wild.

## Cost and licensing

### Is it free?

The software is free (MIT license). AI providers may charge (OpenRouter, Anthropic) or be free (Ollama).

### Can I use it commercially?

Yes, MIT license allows commercial use.

### What are the ongoing costs?

If you use Ollama: electricity for running the model. If you use OpenRouter: API costs, probably a few dollars a month. MusicBrainz is free. Everything else is free.

### Does MusicBrainz cost money?

No, but they appreciate donations. They rate-limit to 1 request per second, which the app respects.

### What if I exceed OpenRouter rate limits?

You'll get an error. Either wait, upgrade your plan, or switch to a different provider.

### Are there any paid tiers or premium features?

No. This is an open-source project, not a SaaS.
