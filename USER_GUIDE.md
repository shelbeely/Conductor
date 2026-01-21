# Conductor user guide

This guide walks you through using Conductor, a music player that you control by typing what you want in plain English. No commands to memorize, no hotkeys to learn upfront.

## Getting started

### First run

After you've installed Conductor and set up MPD (see the README if you haven't done that yet), start the application:

```bash
bun start
```

You'll see three main areas on your screen:

1. The now playing section at the top shows what's currently playing
2. The queue section below that shows upcoming tracks  
3. The command input at the bottom is where you type

The cursor sits at the command prompt. Just start typing.

### Your first command

Try typing something like:

```
play some music
```

Press Enter. Conductor searches your MPD library and starts playing. The AI figures out what you want and translates it into actions.

If nothing happens, check that:
- MPD is running (`systemctl --user status mpd`)
- Your music library has files in it (`mpc listall`)
- The AI provider is configured (check your `.env` file)

### What's on screen

**Now playing area:**
- Track title in bold white
- Artist name in green
- Album name and year in blue
- Genre in magenta (when available)
- Playback state symbol (▶ for playing, ⏸ for paused, ⏹ for stopped)
- Current time and total duration
- Volume level
- Active modes (Repeat, Random, Single, Consume)

**Queue area:**
- Shows the next 10 tracks by default
- Current track has a green ▶ marker
- Track numbers, titles, artists, and durations
- Counter showing total tracks in queue

**Command input:**
- Your typing appears here with a green cursor
- AI responses show in a blue box above your input
- Processing indicator (⏳) appears when working
- Helpful reminders about keyboard shortcuts

## Natural language commands

The whole point is that you don't need to learn syntax. Just say what you want. The AI interprets your intent and executes the right actions.

### Playing music

Start playback:
```
play
start playing
resume
```

Play something specific:
```
play some jazz
play Miles Davis
play Kind of Blue
play Bohemian Rhapsody by Queen
play something upbeat
```

Conductor searches your library for matches. If it finds multiple results, it usually picks the first match or adds several to the queue.

### Controlling playback

Pause:
```
pause
stop playing
halt
```

Skip tracks:
```
next
skip
next track
go to next song
skip this one
```

Go back:
```
previous
go back
previous track
last song
```

Toggle play/pause:
```
toggle
pause if playing
```

Stop completely:
```
stop
stop playback
end
```

### Volume control

Set specific volume:
```
set volume to 50
volume 75
make it 60 percent
```

Volume must be between 0 and 100.

Relative adjustments:
```
turn up the volume
increase volume
make it louder
turn it down
quieter please
lower the volume
```

The AI usually adjusts by 10-15 percent for relative changes.

### Managing the queue

View what's coming up:
```
show queue
what's next
what's in the queue
show me the playlist
```

You'll see the queue on screen already, but asking explicitly can refresh it or give you an AI summary.

Add music:
```
add some Beatles songs
queue Abbey Road
add more jazz to queue
queue something by Radiohead
```

Clear everything:
```
clear queue
empty the queue
remove all tracks
start fresh
```

The AI will confirm before clearing.

### Playback modes

Enable repeat:
```
turn on repeat
enable repeat mode
loop the playlist
repeat on
```

Enable random (shuffle):
```
turn on shuffle
enable random
randomize playback
shuffle on
```

Enable single (stop after current track):
```
enable single mode
play just this one
single track mode on
```

Enable consume (remove tracks after playing):
```
turn on consume mode
consume mode on
enable consume
```

Turn modes off:
```
turn off repeat
disable shuffle
random off
no more single mode
```

You can also use "toggle":
```
toggle repeat
toggle random mode
switch shuffle
```

## Keyboard shortcuts and navigation

- **↑ (Up arrow)**: Scroll back through command history
- **↓ (Down arrow)**: Scroll forward through command history  
- **Enter**: Submit your command to the AI
- **Ctrl+C**: Quit Conductor

Command history works like a terminal. Use up/down arrows to recall what you've typed before. This saves time when you want to run similar commands.

Type naturally at the command prompt. Backspace works as expected. There's no line editing (no left/right arrows to move the cursor), so if you make a mistake in the middle of a line, backspace to that point and retype.

## Understanding the now playing view

The now playing section updates every second while music plays.

**Playback symbols:**
- ▶ means playing
- ⏸ means paused
- ⏹ means stopped

**Progress bar:**
The cyan bar shows playback progress. It fills from left to right as the track plays.

**Time display:**
Shows elapsed time and total duration in minutes:seconds format (e.g., "2:34 / 4:12").

**Volume:**
Displayed as a percentage (0-100%). This reflects the MPD volume setting.

**Mode indicators:**
When active, these appear as colored tags below the progress bar:
- [Repeat] in green - playlist loops when finished
- [Random] in yellow - tracks play in random order
- [Single] in blue - playback stops after current track
- [Consume] in red - tracks removed from queue after playing

**Metadata:**
If MusicBrainz finds additional information about the artist or album, it appears below a separator line. This includes country of origin, formation year, or other details.

**Album art:**
If you have Überzug++ installed and working, album art displays to the left of the track info. Without Überzug++, you get ASCII art generated from the track and artist names instead.

## Working with the queue

Think of the queue as your current playlist. It's what MPD will play in order (unless random mode is on).

**How it fills up:**
- You add music manually with queue commands
- Conductor adds matches when you play something
- The AI might add multiple results if your query is broad

**Viewing the queue:**
The queue always shows on screen, listing up to 10 tracks. If you have more, it displays "... and X more tracks" at the bottom.

The current playing track has a green arrow (▶) next to it.

**Reordering and removing:**
Right now, you need to use MPD tools directly for granular queue management:
```bash
mpc move 5 1    # Move position 5 to position 1
mpc del 3       # Delete position 3
```

You can also clear the entire queue through Conductor with natural language ("clear the queue").

**Queue behavior with modes:**
- Normal: Plays top to bottom, then stops
- Repeat: Plays top to bottom, then starts over
- Random: Plays in random order
- Single: Stops after current track (ignores rest of queue)
- Consume: Deletes each track after playing it

## Working with playlists

MPD supports saved playlists, but Conductor doesn't have direct natural language commands for them yet. Use `mpc` commands for now:

```bash
# List playlists
mpc lsplaylists

# Load a playlist
mpc load "My Playlist"

# Save current queue as playlist
mpc save "New Playlist"

# Delete a playlist
mpc rm "Old Playlist"
```

After loading a playlist with `mpc`, the tracks appear in Conductor's queue view automatically.

## Volume and playback settings

**Volume:**
MPD's volume control is independent from your system volume. Setting volume to 50 in Conductor means 50% of MPD's output, which then gets amplified by your system volume and hardware.

If you can't hear anything:
1. Check MPD volume in Conductor (should show in now playing area)
2. Check system volume (`alsamixer` or your desktop mixer)
3. Check physical speaker volume

If 100% is too quiet, your system volume might be low. If it's too loud, lower MPD volume instead of cranking system volume way down.

**Repeat mode:**
The playlist repeats infinitely until you turn off repeat. Good for ambient music or when you want continuous playback.

**Random mode:**
Tracks play in unpredictable order. MPD handles the randomization, so the queue view doesn't reorder visually - it just plays positions non-sequentially.

**Single mode:**
Useful when you want to hear one specific track and then stop. Combine with repeat to loop a single track forever.

**Consume mode:**
Each track disappears from the queue after playing. This is different from single mode, which stops playback but leaves the queue intact. Consume keeps going through the queue while removing tracks along the way.

**Combining modes:**
You can enable multiple modes at once:
- Repeat + Random = infinite shuffled playback
- Single + Repeat = loop one track forever
- Random + Consume = shuffle through queue once, deleting as you go

## Tips and tricks

**Search broadly:**
If you type "play some jazz", Conductor searches your library for anything tagged with jazz genre. The more specific you are ("play Miles Davis So What"), the more targeted the results.

**Check your tags:**
MPD relies on file metadata. If your files don't have artist/album/genre tags, Conductor can't search them effectively. Use a tool like `beets` or `MusicBrainz Picard` to tag your library properly.

**Metadata enrichment:**
Conductor queries MusicBrainz to add information like release dates and artist origins. This happens in the background when tracks load. If you're offline or MusicBrainz is slow, you just won't see the extra details.

**Album art caching:**
Cover images download once and get cached. If you have a large library, the cache grows over time. You can clear it manually if it gets too big (check `~/.cache/conductor` or wherever your system puts temp files).

**Command history:**
Your command history persists during the session but resets when you close Conductor. If you find yourself typing the same thing repeatedly, consider using MPD playlists instead.

**AI response variations:**
Different AI models respond differently. Claude might be chatty and explanatory. Llama might be terse. Conductor shows whatever the AI returns. If responses are too verbose or too cryptic, try switching models in your `.env` file.

**Local vs. remote AI:**
Ollama runs on your machine, so it works offline and costs nothing. OpenRouter uses cloud models, which are usually faster and smarter but require internet and cost money per request. Anthropic is similar to OpenRouter but uses Claude directly.

For casual listening, Ollama with llama3.2 works fine. For complex queries or when you want better natural language understanding, use OpenRouter with Claude or GPT-4.

**MPD client compatibility:**
You can use other MPD clients alongside Conductor. Run `ncmpcpp` in another terminal, or use a GUI client like Cantata. They all talk to the same MPD instance, so changes appear everywhere.

## Common workflows

**Morning listening routine:**
```
play some chill morning music
set volume to 40
turn on repeat
```

**Focused work session:**
```
play instrumental jazz
enable repeat mode
turn off random
```

**Discovering new music:**
```
play some ambient electronic
turn on random
enable consume mode
```

This shuffles through matches and removes them, preventing repeats.

**Party mode:**
```
play upbeat dance music
set volume to 80
turn on shuffle
enable repeat
```

**Single album listening:**
```
play Dark Side of the Moon
turn off random
enable repeat
```

**Quick track skip:**
```
next
next
next
```

Or just type "skip three times" and the AI handles it.

**Find and play:**
```
play Blue in Green by Miles Davis
```

More specific searches return better matches.

**Build a queue gradually:**
```
add some Beatles
queue Pink Floyd
add Led Zeppelin to queue
play
```

**Clear and start over:**
```
stop
clear queue
play something completely different
```

## Understanding AI responses

The AI gives feedback after each command. These responses vary based on the model you're using.

**Successful actions:**
```
> play some jazz
AI: Found 47 results for "jazz" - starting playback
```

```
> next track  
AI: Skipped to next track
```

**Search results:**
```
> add Pink Floyd to queue
AI: Added 12 tracks by Pink Floyd to queue
```

When the AI finds multiple matches, it usually adds up to 10 to avoid flooding the queue.

**Error messages:**
```
> play asdfasdf
AI: No results found for "asdfasdf"
```

```
> volume 150
AI: Error: Volume must be between 0 and 100
```

**Context awareness:**
The AI maintains context during your session. You can say things like:
```
> play Miles Davis
AI: Playing Kind of Blue by Miles Davis

> add more from this artist
AI: Added 8 more Miles Davis tracks to queue
```

This works because the AI remembers what you just searched for.

**Ambiguous commands:**
If you type something vague like "do something", the AI might get confused:
```
> make it better
AI: I'm not sure what you'd like me to do. Could you be more specific?
```

Be direct. "Turn up volume" works better than "make it louder please maybe".

**Model differences:**
- **Claude (via OpenRouter)**: Conversational, explains actions, good with ambiguous requests
- **GPT-4 (via OpenRouter)**: Similar to Claude, maybe a bit more verbose  
- **Llama 3.2 (via Ollama)**: Shorter responses, sometimes misses nuance, but fast and free
- **Older models**: Hit or miss with natural language - might need more explicit commands

If your current model isn't understanding you, try rephrasing or switch models.

## Working with different music genres

Conductor works with whatever genres your files are tagged with. Genre search depends entirely on your library's metadata.

**Genre-specific searches:**
```
play some blues
queue death metal tracks
play classical music
add hip hop to queue
```

**Genre mixing:**
```
play jazz fusion
queue rock and blues
play ambient electronic
```

**Mood-based searching:**
The AI tries to interpret mood:
```
play something relaxing
queue upbeat songs
play sad music
```

This works if your tags include descriptive words. If your files just say "Rock" and nothing else, mood searches won't find much.

**Handling large genre collections:**
If you have 500 jazz albums, "play some jazz" might return a random subset. Try narrowing:
```
play bebop jazz
play 1960s jazz
play cool jazz
```

**Genre tags variations:**
Some files might say "Heavy Metal", others "Metal", others "Thrash Metal". MPD searches are literal, so "play metal" finds files tagged exactly as "Metal". The AI helps by trying variations, but inconsistent tagging still causes issues.

Fix this with proper tagging tools before blaming Conductor.

**Creating genre mixes:**
```
play jazz
add some blues
queue classical guitar
turn on random
```

This builds a mixed queue. Random mode shuffles through the genres.

**Genre discovery:**
```
play ambient
turn on random mode
enable consume mode
```

Shuffle through ambient tracks, removing each after playing. Good for exploring what you have.

**Genre-specific modes:**
- Classical albums often sound best with random off (respect the movement order)
- DJ mixes should play in order (don't shuffle)
- Ambient and background music work great on infinite repeat + random
- Concept albums and story-driven music need sequential playback

## Troubleshooting and FAQ

**"Nothing happens when I type a command"**

Check:
1. Is the AI provider running? (Ollama should be running if you use local)
2. Is your API key set correctly in `.env`?
3. Does the console show errors? (Run Conductor in a way that shows console output)

**"AI responses are really slow"**

- Ollama on weak hardware takes time to think
- OpenRouter/Anthropic depend on internet speed
- Large libraries make MPD searches slower
- Try a faster model (smaller Ollama models or GPT-3.5 on OpenRouter)

**"No album art shows up"**

Überzug++ only works on certain terminal emulators and Linux systems. If you're using a non-compatible terminal, you get ASCII art instead. Check that Überzug++ is installed (`which ueberzug`) and your terminal supports it.

**"Songs have wrong information"**

MPD reads metadata from your files. If the files have bad tags, MPD shows bad information. Conductor adds MusicBrainz data when possible, but it can't fix fundamentally wrong file tags.

**"Queue doesn't match what the AI said"**

Sometimes the AI says "Added 20 tracks" but you only see 10. This might be because:
- The AI estimated
- Some files didn't match the search filter
- The display limits queue view to 10 items (scroll or check full queue)

**"Random mode doesn't look random"**

The queue display shows tracks in order, but MPD plays them randomly. The visual order doesn't change. This is how MPD works.

**"Conductor freezes after a command"**

The AI might have timed out or hit an error. Press Ctrl+C to quit and restart. Check your AI provider status and internet connection.

**"Can I use Conductor remotely?"**

You can connect to a remote MPD instance by setting `MPD_HOST` and `MPD_PORT` in your `.env` file. Conductor itself runs locally, but it can control remote MPD.

**"Does Conductor work on Mac or Windows?"**

It's built for Linux but might work on Mac with some tweaking. Windows requires WSL. MPD, Überzug++, and terminal requirements make non-Linux platforms tricky.

**"Can I change the colors or layout?"**

Not without editing the source code. The UI components are in `src/ui/`. You'd need to modify the Ink components and rebuild.

**"What's the performance impact?"**

Minimal. Conductor polls MPD once per second for updates. The AI only runs when you submit a command. MusicBrainz API calls happen once per track and get cached. Album art downloads once per unique cover.

**"How much does OpenRouter cost?"**

Depends on the model. Claude 3.5 Sonnet costs about $3 per million input tokens and $15 per million output tokens. For Conductor, each command uses maybe 500-1000 tokens total. So you'd get thousands of commands for a dollar.

**"Can I add my own commands?"**

Yes, but it requires code changes. The tool definitions are in `src/ai/agent.ts` and the handlers are in `src/App.tsx`. Define a new tool schema, add it to the tools array, and implement the handler.

**"Does Conductor work with streaming services?"**

No. It controls MPD, which plays local files. If you want streaming, look into MPD plugins for services or use a different player.

**"How do I update Conductor?"**

```bash
cd Conductor
git pull
bun install
bun run build
```

Your `.env` configuration persists across updates.

---

That covers most of what you need to know. Experiment with different commands and see what works. The AI handles a lot of variation, so there's no single "correct" way to phrase things. Just type what feels natural.
