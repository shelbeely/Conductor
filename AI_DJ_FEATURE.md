# AI DJ Feature

The AI DJ feature adds radio-style hosts that pop in between songs to share commentary, just like listening to a real radio station or music podcast.

## How it works

Instead of interrupting every track, the AI hosts appear automatically every 4-5 songs with short (30-60 second) commentary. They discuss:
- Artist backstories
- Song trivia and production details
- Cultural context
- Fun "did you know?" moments

Think of it as a knowledgeable friend sitting next to you on the couch, not a robot demanding the aux cord.

## Key features

**Automatic activation:**
- Activates when you play radio stations or auto-generated playlists
- No manual triggering needed
- Layers commentary on top of your queue without hijacking it

**Smart timing:**
- Speaks every 4-5 songs (not after every track)
- Short interjections (30-60 seconds)
- Doesn't interrupt the music flow

**Co-host format:**
- Two AI hosts (Host 1 and Host 2) talk to each other
- Male voice (Echo) and female voice (Shimmer)
- Conversational back-and-forth, not scripted announcements

**Self-aware and honest:**
- Introduce themselves as AI the first time
- Openly warn they might be wrong sometimes
- "We're AI, so take what we say with a grain of salt"

**Radio DJ energy:**
- Conversational rather than robotic
- Natural reactions ("Oh man, this track!")
- Fun banter between hosts
- One interesting fact per commentary

## Configuration

Enable/disable in your `.env` file:

```bash
# Enable TTS first
TTS_ENABLED=true
TTS_PROVIDER=openai

# AI DJ Feature
AI_DJ_ENABLED=true
AI_DJ_FREQUENCY=4  # Songs between commentary (default: 4)
```

## Commands

Control the AI DJ during playback:

```
enable dj          # Turn on AI DJ hosts
disable dj         # Turn off AI DJ hosts
turn off dj        # Same as disable
activate dj        # Same as enable
```

## When it activates

The AI DJ works best with:
- **Radio stations** - Perfect for continuous listening
- **Auto-generated playlists** - Adds context to AI-curated mixes
- **Long listening sessions** - Commentary every few songs keeps it fresh

It stays quiet during:
- Manual "Beyond the Beat" requests (different feature)
- Single track playback
- When explicitly disabled

## Example commentary

**First time introduction:**
```
Host 1: Hey there! We're your AI co-hosts popping in to share some music knowledge.
Host 2: Yep, we're AI-generated, so we might get things wrong sometimes, but we'll keep it interesting!
Host 1: We'll chime in every few songs with fun facts and trivia.
Host 2: Alright, let's talk about this track...
```

**Regular commentary:**
```
Host 1: Man, "Paranoid Android" by Radiohead - what a journey this song is!
Host 2: Right? It's actually three different songs stitched together. Thom Yorke called it "three different songs that couldn't work on their own."
Host 1: And that title? Straight from the Hitchhiker's Guide to the Galaxy character.
Host 2: Classic 90s alt-rock at its finest.
```

## UI indicators

When AI DJ is active, you'll see:
- 🎙️ Icon in the status bar
- "AI DJ hosts active - they'll pop in every 4-5 songs"
- Subtle notification when commentary starts: "🎙️ AI DJs chiming in..."

## Technical details

**Voice assignment:**
- Host 1 = Echo (male voice)
- Host 2 = Shimmer (female voice)

**Audio handling:**
- Commentary is pre-generated and cached
- Queued in background - doesn't block music
- Seamless transitions between voices
- Falls back silently if TTS fails

**Frequency:**
- Default: Every 4 songs
- Configurable via `AI_DJ_FREQUENCY` environment variable
- Tracks counter resets when commentary plays

## Comparison: AI DJ vs Beyond the Beat

| Feature | AI DJ | Beyond the Beat |
|---------|-------|-----------------|
| Trigger | Automatic every 4-5 songs | Manual command |
| Length | 30-60 seconds | 2-3 minutes |
| Format | Short DJ commentary | Deep dive discussion |
| Use case | Background listening | Focused learning |
| Frequency | Every 4-5 tracks | On demand per track |

Both features can be used together - AI DJ for casual listening, Beyond the Beat when you want to learn more about a specific track.

## Privacy and performance

**Network usage:**
- Requires AI API calls (OpenRouter, Ollama, or Anthropic)
- TTS synthesis (OpenAI or local Piper)
- MusicBrainz metadata (optional enrichment)

**Local option:**
- Use Ollama for AI (runs locally)
- Use Piper for TTS (runs locally)
- Zero network usage, completely private

**Caching:**
- Commentary is cached per track
- Prevents regeneration for repeated plays
- Reduces API costs and latency

## Troubleshooting

**AI DJ not speaking:**
- Check `TTS_ENABLED=true` in .env
- Verify TTS provider is configured
- Ensure audio player is available (aplay, mpg123, etc.)
- Check `AI_DJ_ENABLED=true`

**Commentary too frequent:**
- Increase `AI_DJ_FREQUENCY` (e.g., 6 or 8)
- Default is 4 songs between commentary

**Want to disable temporarily:**
- Type `disable dj` in the command input
- Re-enable with `enable dj`

**AI DJ interrupting manually:**
- This shouldn't happen - it only triggers on track changes
- If it does, try `disable dj` then `enable dj` to reset

## Future enhancements

Potential improvements being considered:
- Custom host personalities
- User-configurable commentary length
- Learning from your listening habits
- Multiple language support
- Genre-specific hosts
