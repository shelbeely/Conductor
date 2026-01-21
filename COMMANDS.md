# Conductor command reference

This is a guide to talking with Conductor. Not a manual of exact syntax you need to memorize, but a reference showing how the natural language understanding actually works.

The AI interprets what you want and maps it to MPD operations. You can phrase things however feels natural - the examples here just show what tends to work well.

## How this actually works

When you type a command, the AI looks at your words and figures out which music operations you want. It has access to these tools:

- `search_music` - Find tracks, albums, or artists in your library
- `play_music` - Start playing something immediately
- `queue_music` - Add stuff to the queue without interrupting current playback
- `control_playback` - Play, pause, stop, skip, go back
- `set_volume` - Change volume (0-100)
- `toggle_setting` - Turn repeat, random, single, or consume mode on/off
- `get_queue` - Show what's queued up
- `clear_queue` - Empty the queue

The AI picks the right tools based on your intent. "Play some jazz" searches first, then starts playing. "Skip this" just controls playback. "Add more Beatles" searches and queues.

You don't need to think about which tool does what. Just say what you want.

## Playback control

Basic operations that control what's happening right now.

### Starting playback

```
play
start
hit play
resume
unpause
keep going
start playing
```

If the queue has tracks and playback is stopped or paused, these commands get it moving again.

### Pausing

```
pause
hold on
stop for a sec
pause it
hit pause
wait
pause playback
freeze
```

Pauses current playback. The track stays queued, you're just taking a break.

### Stopping completely

```
stop
stop playback
stop everything
full stop
end playback
kill it
```

Stops playback and resets position. Different from pause - this is "I'm done listening" not "I'll be right back."

### Toggling play/pause

```
toggle
toggle playback
play or pause
pause if playing
switch it
flip playback state
```

If it's playing, pause. If it's paused, play. Good for when you're not sure what state it's in or you're hammering the same command repeatedly.

## Search and play

The meat of what Conductor does. You describe music, it finds it and plays it.

### By artist

```
play The Beatles
play some Miles Davis
put on Radiohead
I want to hear Pink Floyd
play me some Björk
start playing Kendrick Lamar
play Miles Davis Kind of Blue
some Coltrane would be nice
throw on some Herbie Hancock
let's hear what Fela Kuti sounds like
```

Artist search looks at the artist tag in your files. Be as specific or vague as you want.

### By album

```
play Dark Side of the Moon
put on Abbey Road
play Kind of Blue by Miles Davis
I want to hear The Velvet Underground and Nico
play Blonde by Frank Ocean
start OK Computer
play Igor
put on Pet Sounds
In Rainbows please
play the White Album
```

Album searches look at album tags. If you want to specify artist too, that helps narrow it down when you have multiple versions.

### By track

```
play Bohemian Rhapsody
play Blue in Green
I want to hear A Love Supreme
play What's Going On
put on Hey Jude by The Beatles
play Purple Haze
play Take Five by Dave Brubeck
Let's hear Smells Like Teen Spirit
play Ms. Jackson
put on Nutshell by Alice in Chains
```

Track searches look at title tags. Adding artist helps if you have covers or multiple versions.

### By genre

```
play some jazz
I want to hear metal
put on classical music
play hip hop
some electronic would be nice
play death metal
I'm in the mood for blues
play some ambient
throw on reggae
let's hear folk music
```

Genre search depends entirely on your file tags. If your library has well-tagged genres, this works great. If not, you'll get random results or nothing.

### By mood or vibe

```
play something relaxing
I want upbeat music
play sad songs
something chill please
play angry music
I need focus music
play party music
something smooth
play energetic tracks
I want melancholy stuff
```

The AI tries to interpret mood and map it to genres or search terms. This works if your tags include descriptive words or if common genre associations match what you want (jazz → relaxing, metal → energetic, etc.).

### By year or era

```
play music from the 60s
I want 90s hip hop
play 1970s rock
something from 2015
play 80s synthpop
music from the 2000s
play old blues from the 30s
I want new stuff from 2023
```

This only works if your files have date tags. The AI searches for year ranges or specific years.

### Combinations

```
play upbeat jazz from the 60s
I want sad indie rock
play heavy doom metal
some chill electronic ambient
play fast bebop
aggressive punk from the 80s
smooth neo soul
play dark atmospheric black metal
uplifting gospel music
melancholy folk songs
```

You can combine genre, mood, era, and descriptors. The AI parses all of it and builds a search query. Results depend on your tags having the right keywords.

### Complex artist requests

```
play something by Herbie Hancock or Miles Davis
I want tracks featuring John Coltrane
play albums produced by Rick Rubin
anything with Nels Cline on guitar
play collaborations between Thom Yorke and others
tracks where Robert Glasper plays piano
```

Some of these work, some don't. Artist tags are usually just the main artist, not every session player or producer. The AI tries, but MPD's search is limited to what's actually in the tags.

### Discovery and exploration

```
play something I haven't heard in a while
give me something random
play a deep cut
I want to discover new stuff
play an album I've never heard
something surprising
play a random genre
what do I have that's weird
```

The AI interprets "random" or "discovery" requests by doing broad searches or suggesting shuffle mode. It can't truly recommend based on listening history (MPD doesn't track that), so these commands just pull from your library somewhat unpredictably.

## Queue management

Managing what plays next without interrupting the current track.

### Adding to queue

```
add some Beatles to the queue
queue more jazz
add Pink Floyd
queue Abbey Road
add this album to queue
queue up some metal
put Led Zeppelin in the queue
add tracks by Radiohead
queue the next album
throw some blues in there
```

These search and add results to the end of the queue. Current playback continues.

### Adding next in queue

```
play this next
add this to the front of the queue
queue this up next
I want to hear this song next
play it after the current track
bump this to the top
```

The AI understands "next" as queue position priority. It searches and adds the result right after the currently playing track.

### Viewing the queue

```
show queue
what's in the queue
show me what's next
what's queued up
list the queue
what's coming up
show upcoming tracks
what's in the playlist
let me see the queue
```

You already see the queue on screen, but asking explicitly can trigger a refresh or give you an AI summary if you have a huge queue.

### Clearing the queue

```
clear queue
empty the queue
remove everything
clear all tracks
delete the queue
start over
wipe the queue
clear it out
remove all songs
```

The AI confirms before actually clearing. This is destructive so it double-checks.

### Removing specific items

```
remove the last track
delete the next song
remove track 5
take out that Beatles song
delete the first three tracks
remove everything by Pink Floyd
```

Some of these work if you phrase them right, but detailed queue editing is limited right now. For precise control, use `mpc` directly:

```bash
mpc del 5        # Remove position 5
mpc del 1 3      # Remove positions 1-3
```

## Volume control

Volume is 0-100, representing MPD's output level.

### Setting exact volume

```
set volume to 50
volume 75
make it 60 percent
set the volume at 40
volume to 85
put volume at 30
set it to 100
volume 20
```

Give a number between 0 and 100. The AI extracts the number and sets it.

### Increasing volume

```
turn up the volume
louder
increase volume
bump it up
make it louder
volume up
turn it up a bit
crank it
more volume please
raise the volume
```

Usually increases by 10-15 points. The exact amount depends on what the AI decides is reasonable.

### Decreasing volume

```
turn down the volume
quieter
lower volume
bring it down
make it quieter
volume down
turn it down
less loud
reduce volume
```

Usually decreases by 10-15 points.

### Muting

```
mute
silence
mute it
turn off the sound
shut it up
zero volume
kill the sound
```

Sets volume to 0. You can unmute by setting volume again or saying "unmute" or "turn the volume back on."

### Unmuting

```
unmute
bring the volume back
turn it back on
restore volume
unmute it
sound back on
```

If you muted by setting to 0, this brings it back to whatever it was before. If you manually set to 0, the AI might just set it to 50 or something reasonable.

## Playback settings

MPD has four boolean settings you can toggle: repeat, random, single, consume.

### Repeat mode

Repeat makes the queue loop infinitely.

**Enabling:**
```
turn on repeat
enable repeat mode
repeat on
loop the playlist
turn repeat on
enable looping
repeat mode on
set repeat
loop it
```

**Disabling:**
```
turn off repeat
disable repeat
repeat off
stop looping
no more repeat
turn repeat off
repeat mode off
disable looping
```

**Toggling:**
```
toggle repeat
switch repeat mode
flip repeat
toggle repeat on or off
repeat toggle
```

### Random mode (shuffle)

Random plays tracks in unpredictable order.

**Enabling:**
```
turn on shuffle
enable random
shuffle mode on
randomize playback
shuffle on
turn on random mode
enable shuffle
random on
shuffle it
mix it up
```

**Disabling:**
```
turn off shuffle
disable random
shuffle off
no more random
sequential playback
turn random off
disable shuffle
random mode off
play in order
```

**Toggling:**
```
toggle shuffle
toggle random
switch shuffle mode
flip random
shuffle toggle
toggle random mode
```

### Single mode

Single stops playback after the current track ends. Good for "play this one song then stop."

**Enabling:**
```
enable single mode
turn on single
single mode on
play just this one
stop after this track
single track mode
turn single on
play one and stop
```

**Disabling:**
```
disable single mode
turn off single
single off
play normally
keep playing after this
turn single mode off
no single mode
```

**Toggling:**
```
toggle single
toggle single mode
switch single
flip single mode
single toggle
```

### Consume mode

Consume removes each track from the queue after playing it. The queue shrinks as you listen.

**Enabling:**
```
turn on consume mode
enable consume
consume on
consume mode on
remove tracks after playing
turn consume on
enable consume mode
delete as you go
```

**Disabling:**
```
turn off consume mode
disable consume
consume off
stop removing tracks
turn consume mode off
keep tracks in queue
no consume mode
```

**Toggling:**
```
toggle consume
toggle consume mode
switch consume
flip consume mode
consume toggle
```

### Combining modes

You can enable multiple modes at once. Some useful combinations:

**Infinite shuffle:**
```
turn on repeat and random
enable shuffle and loop
repeat on, random on
shuffle and repeat please
```

**Loop one track forever:**
```
turn on single and repeat
repeat this one song
loop this track
single plus repeat
```

**Shuffle through queue once:**
```
enable random and consume
shuffle and delete as you go
random on, consume on
```

## Navigation

Moving between tracks.

### Skipping forward

```
next
skip
next track
skip this
skip to next
go forward
next song
move to next
advance
skip ahead
```

Moves to the next track in queue. If random is on, moves to whatever MPD considers "next" in its randomized order.

### Going back

```
previous
go back
previous track
back one
last track
go to previous
previous song
back to last
rewind
go backward
```

Goes back one track. Or restarts the current track from the beginning if you're more than a few seconds in - that's MPD's default behavior.

### Skipping multiple

```
skip forward 3 tracks
go forward 5 songs
next next next
skip ahead 4
jump forward 10
advance 2 tracks
```

The AI interprets numbers and applies multiple skip commands. Some models handle this better than others.

### Jumping to specific positions

```
play track 5
jump to position 7
play the third track
go to track number 10
play item 2 in queue
```

Tells MPD to start playing a specific queue position. This works because `play_music` accepts a position parameter.

### Restarting current track

```
restart
restart this track
play from the beginning
start over
restart the song
go back to the start
```

The AI usually interprets this as "go back" which restarts if you're already early in the track, or it might just seek to 0:00 if the model is smart enough.

## Information commands

Getting status and metadata about what's playing or queued.

### Current track info

```
what's playing
what is this
what song is this
tell me about this track
what's this called
who's playing
what album is this
song info
current track
```

The UI already shows this, but asking can get you an AI response with formatted details or extra context from MusicBrainz.

### Queue status

```
show queue
how many tracks are queued
what's in the queue
list upcoming songs
what's next
show me the playlist
what's coming up
queue status
how long is the queue
```

The queue is visible on screen, but this can give you a summary or refresh the display.

### Playback status

```
status
what's the status
are we playing or paused
playback status
what's going on
is anything playing
current state
show status
```

Tells you play/pause/stop state, current track, queue length, volume, and active modes.

### Volume level

```
what's the volume
how loud is it
current volume
show volume
volume level
what's it set to
```

Shows the current volume percentage.

### Active modes

```
what modes are on
is repeat enabled
is shuffle on
show settings
what's enabled
which modes are active
are we in random mode
is single mode on
```

Lists which of the four modes (repeat, random, single, consume) are currently enabled.

## Library browsing

Exploring what you have without necessarily playing it immediately.

### Listing artists

```
show me all artists
list artists
what artists do I have
show my artists
who's in my library
list all bands
show musicians
```

This depends on whether the AI interprets it as a search or an information request. MPD can list all unique artists, but the AI needs to frame it as a search query.

### Listing albums

```
show me all albums
list albums
what albums do I have
show my collection
list all releases
what's in my library
show all album titles
```

Same deal as artists - the AI might search broadly or try to list everything. MPD can list all albums but it might be a huge list.

### Listing genres

```
what genres do I have
list all genres
show me genres
what types of music do I have
list music styles
show genre tags
```

If your library is tagged consistently, this can show you all unique genres. Useful for discovery.

### Browsing by folder

```
show me music in the jazz folder
list files in Rock/
what's in the Blues directory
browse my Metal folder
```

MPD supports browsing by directory path, but Conductor's natural language layer doesn't expose this super cleanly yet. You might get search results instead of literal directory listings.

### Searching without playing

```
search for Radiohead
find Miles Davis
look for Kind of Blue
do I have any Björk
search my library for jazz
find tracks by Coltrane
```

Using words like "search" or "find" without "play" should trigger a search and show results without starting playback. Whether this works depends on the AI's interpretation.

## Playlist generation

**NEW in v0.2.0:** AI-powered playlist generation based on mood, genre, activity, or energy level.

### Mood-based playlists

```
create a relaxing playlist
generate a chill playlist
make a calming playlist
build a soothing playlist
create an energetic playlist
generate an upbeat playlist
make a melancholy playlist
```

The AI searches your library for tracks matching the mood and builds a queue.

### Activity-based playlists

```
create a workout playlist
make a focus playlist
generate study music
build a party playlist
create running music
make a cooking playlist
generate dinner music
build a morning playlist
```

Playlists designed for specific activities. The AI picks tracks with appropriate energy and vibe.

### Genre-based playlists

```
create a jazz playlist
make a rock playlist
generate a classical playlist
build a metal playlist
create an electronic playlist
```

Focus on specific genres. Works best with well-tagged libraries.

### Energy level playlists

```
create a high-energy playlist
make a low-energy playlist
generate an intense playlist
build a mellow playlist
```

The AI interprets energy level and finds matching tracks.

### Playlist with target length

```
create a 20-track jazz playlist
make a 30-song workout playlist
generate a 2-hour relaxing playlist
build a 50-track party playlist
```

Specify how many tracks you want. Default is 20 if not specified.

### Shuffled playlists

```
create a shuffled workout playlist
make a randomized jazz playlist
generate a mixed rock playlist
```

The AI generates the playlist and shuffles it before adding to queue.

### Theme-based playlists

```
create a 90s nostalgia playlist
make a summer vibes playlist
generate a rainy day playlist
build a road trip playlist
create a late night playlist
```

Thematic playlists based on era, season, or situation.

### Combining criteria

```
create a relaxing jazz playlist with 30 tracks
make an upbeat workout playlist
generate a chill electronic playlist for studying
build a high-energy rock playlist for running
create a mellow acoustic playlist for evenings
```

Mix mood, genre, activity, and length for precise playlists.

## Saved playlists

MPD's saved playlist feature requires `mpc` commands for now:

```bash
# List saved playlists
mpc lsplaylists

# Load a playlist into the queue
mpc load "My Favorites"

# Save current queue as a playlist
mpc save "New Mix"

# Add current playing track to a playlist
mpc playlist "Evening Mix" add

# Remove a playlist
mpc rm "Old Playlist"
```

After loading with `mpc load`, the tracks appear in Conductor's queue and you can control playback normally.

Future natural language commands for saved playlists might look like:

```
load my chill playlist
save this queue as workout mix
add this track to my favorites
```

But these don't work yet. Use `mpc` commands directly.

## AI model management

**NEW in v0.2.0:** Switch between AI models on the fly without restarting.

### List available models

```
show available models
list models
what models can I use
show me the models
which models are available
list all models
```

Displays models available from your current AI provider (OpenRouter, Ollama, or Anthropic).

### Switch models

```
use llama3.2
switch to claude
use gpt-4 model
change to llama3.2
switch model to anthropic/claude-3.5-sonnet
use the mistral model
```

Changes the active AI model. The model name depends on your provider:

- **Ollama**: `llama3.2`, `mistral`, `codellama`, etc.
- **OpenRouter**: `anthropic/claude-3.5-sonnet`, `openai/gpt-4`, etc.
- **Anthropic**: `claude-3-opus`, `claude-3-sonnet`, etc.

Model persists for the session but resets when you restart Conductor.

### Check current model

```
what model are we using
which model is active
show current model
what's the current model
which model am I using
```

Displays the currently active model name and provider.

### Show provider

```
what provider are we using
which AI provider is active
show me the provider
```

Shows whether you're using Ollama, OpenRouter, or Anthropic.

### Model info

When you list models, you see:

- Model ID (full identifier)
- Display name
- Description (if available)
- Context length (max tokens)
- Pricing (for cloud providers)

This helps you pick the right model for your needs. Smaller models are faster, larger models understand better.

## Advanced commands

Combining multiple actions or complex queries.

### Sequential actions

```
clear queue and play some jazz
stop, clear the queue, then play Pink Floyd
pause, turn on shuffle, then resume
skip to the next track and turn up the volume
```

The AI can interpret multi-step commands if you connect them clearly. It might call multiple tools in sequence.

### Conditional actions

```
if this is jazz, add more jazz to the queue
play something different if this is too loud
skip if this isn't good
pause if it's playing, play if it's paused
```

The AI understands conditional logic to some extent. "Pause if playing" is basically the toggle command. More complex conditionals might not work reliably.

### Contextual follow-ups

After you play something, the AI remembers context:

```
> play Miles Davis
> add more from this artist
> what year is this album from
> queue the next album by them
> play something similar
```

The AI keeps conversation history, so "this artist" refers to Miles Davis from your previous command. This works for about the last 10 messages, then history gets pruned.

### Filtering and refinement

```
play jazz but not smooth jazz
I want rock but skip the ballads
play electronic music from the 90s only
metal but nothing too heavy
classical but only piano pieces
```

These filters work if your tags support them. The AI builds a search query with inclusions and exclusions. MPD searches for text matches, so "not smooth jazz" means excluding files with "smooth jazz" in the genre tag.

### Quantity specifications

```
add 5 tracks by Radiohead
queue 10 random jazz songs
play 20 minutes of ambient music
add an hour of classical
put 3 albums in the queue
```

The AI tries to limit search results to match your quantity request. "5 tracks" means it tells MPD to return 5 results. "20 minutes" is trickier since it requires calculating duration - that might not work precisely.

### Multiple artists or albums

```
play both Kind of Blue and Sketches of Spain
add Beatles and Stones to the queue
I want to hear Led Zeppelin, Pink Floyd, and Black Sabbath
queue up Radiohead and Björk
```

The AI can parse lists and search for each item. It queues all the results sequentially.

## Command syntax patterns

How the AI interprets different phrasings.

### Imperative vs. polite requests

```
play some jazz
could you play some jazz
would you mind playing some jazz
jazz please
please play jazz
play jazz thank you
```

All of these work. The AI strips out politeness markers and focuses on the action. You don't need to say please or thank you, but it doesn't hurt.

### Questions vs. commands

```
what's playing?
can you tell me what's playing?
I want to know what's playing
tell me what's playing
show me the current track
could you show me what's playing
```

Questions about state trigger information commands. The AI understands "what," "show," "tell me" as information requests, not actions.

### Explicit vs. implicit actions

**Explicit:**
```
search for jazz and then play it
find Pink Floyd and add it to the queue
look up Miles Davis, then start playing
```

**Implicit:**
```
play some jazz
queue Pink Floyd
add Miles Davis
```

Implicit commands assume the necessary steps. "Play jazz" implies search then play. The AI handles the steps automatically.

### Direct objects vs. descriptions

**Direct object (specific):**
```
play Kind of Blue
play Bohemian Rhapsody
play The Beatles
```

**Description (broad):**
```
play something chill
play upbeat music
play whatever
```

Both work. Direct objects search for exact matches. Descriptions search for tags or keywords that match the vibe.

### Pronouns and references

```
play it
add more like this
skip this one
what's this called
queue that artist
play them
```

Pronouns ("it," "this," "that," "them") work if there's context from previous commands. "Play it" after a search makes sense. "Play it" as your first command doesn't.

### Negations

```
not this
skip this
don't play this
remove this from queue
stop playing this
I don't want this
```

Negations usually translate to skip, pause, or remove actions. "Not this" means skip. "Don't play this" might mean pause or remove from queue.

### Abbreviations and slang

```
play smth chill
queue smth by Pink Floyd
idk play whatever
skip it idc
next pls
turn up vol
```

The AI handles common abbreviations pretty well. "Smth" (something), "idk" (I don't know), "idc" (I don't care), "pls" (please), "vol" (volume) all work. More obscure slang might confuse it.

## Ambiguous commands

How the AI resolves unclear requests.

### "Play" ambiguity

"Play" can mean multiple things:

1. Start playback if paused/stopped
2. Search for something and play it
3. Play a specific queue position

The AI decides based on context:

```
> pause
> play
# Resumes current track

> play some jazz
# Searches and plays jazz

> play track 5
# Jumps to queue position 5
```

If you just type "play" with nothing queued, the AI might ask for clarification or search for something random.

### "Next" ambiguity

"Next" can mean:

1. Skip to next track
2. Add something to the front of the queue

```
> next
# Skips to next track

> add this next
# Adds to queue after current track
```

The word "add" or "queue" clarifies you mean queue position, not skip.

### Volume ambiguity

"Turn it up" or "make it louder" without a specific number leaves the AI to decide how much. Different models pick different increments. Usually it's 10-15%, but you might get 5% or 20%.

If you want precision, specify:

```
increase volume by 10
turn it up to 75
add 15 to the volume
```

### Genre ambiguity

Broad genre terms like "play some music" or "play something" might return random results because the AI doesn't know what you want.

If this happens, be more specific:

```
play some rock
play anything upbeat
queue random jazz
```

Or just let it surprise you. Sometimes randomness is fine.

### Mode toggle ambiguity

"Turn on shuffle" is clear. Just "shuffle" by itself is less clear - does it mean enable shuffle mode, or shuffle the current queue?

```
shuffle
# Might enable random mode, or might reorder queue

turn on shuffle mode
# Definitely enables random mode

shuffle the queue
# Might try to reorder queue (but MPD doesn't support this)
```

Be explicit if you want a specific behavior.

## Tips for better recognition

Things that make commands work more reliably.

### Be direct

```
Good: play Miles Davis
Bad: so I was thinking maybe we could like listen to some Miles Davis if that's cool
```

Extra words confuse the AI. State what you want clearly.

### Use specific names

```
Good: play Kind of Blue by Miles Davis
Bad: play that one jazz album with the blue cover
```

Conductor searches metadata tags, not cover art or vague descriptions. Use actual artist and album names.

### Check your tags

If commands aren't finding stuff, check your file metadata:

```bash
mpc listall | head
mpc search artist "Miles Davis"
mpc search album "Kind of Blue"
```

If MPD can't find it, Conductor can't either. Tag your library properly with tools like MusicBrainz Picard or beets.

### One action per command

```
Good: turn on shuffle
Good: set volume to 50
Bad: turn on shuffle and set volume to 50 and skip to next track
```

Multi-action commands sometimes work, but single-action commands are more reliable. If something fails, split it into multiple commands.

### Use common phrasings

The AI is trained on typical language. Common commands work better than creative ones:

```
Good: play some jazz
Good: next track
Bad: commence auditory processing of jazz-oriented compositions
Bad: advance the playback iterator to the subsequent queue element
```

Talk like a normal human, not a programmer writing documentation.

### Specify units for volume

```
Good: set volume to 50
Good: volume 75 percent
Ambiguous: set volume to half
```

Numbers are clearer than vague terms like "half" or "medium."

### Use "mode" for settings

```
Good: turn on repeat mode
Good: enable random mode
Ambiguous: turn on repeat
Ambiguous: enable random
```

Adding "mode" makes it clearer you mean the playback setting, not some other action.

### Give feedback

If the AI consistently misinterprets something, try rephrasing. Different words trigger different tool calls. If "shuffle" doesn't work, try "enable random mode." If "louder" does nothing, try "increase volume" or "set volume to 75."

## Use case commands

Common scenarios and the commands that fit them.

### Party mode

You want continuous, energetic music that doesn't stop:

```
clear queue
play upbeat dance music
turn on shuffle
turn on repeat
set volume to 80
```

This builds a shuffled queue that loops forever at party volume.

### Focus mode

Instrumental or ambient music that helps concentration:

```
play instrumental jazz
turn off random
turn on repeat
set volume to 40
```

Sequential playback, lower volume, looping so it doesn't stop during work sessions.

### Discovery mode

Exploring your library without repeating tracks:

```
play something random
turn on shuffle
turn on consume mode
```

Consume mode removes tracks after playing so you don't hear the same thing twice. Good for "what do I even have" sessions.

### Relaxation mode

Chill, mellow music for unwinding:

```
play ambient electronic
turn on repeat
turn off shuffle
set volume to 30
```

Quiet, in-order playback that continues indefinitely.

### Workout mode

High-energy music to keep you moving:

```
play aggressive metal
turn on shuffle
turn on repeat
set volume to 90
```

Loud, shuffled, continuous playback.

### Album listening

Focused listening to a specific album in order:

```
clear queue
play Dark Side of the Moon
turn off random
turn off repeat
```

Just the album, start to finish, then stops.

### Background music

Something that plays without too much attention:

```
play classical music
turn on shuffle
turn on repeat
set volume to 35
```

Randomized, continuous, at low volume so it fades into the background.

### Deep listening session

Multiple albums by one artist, in order:

```
clear queue
play Miles Davis
turn off random
turn off repeat
```

Lets you hear several albums sequentially without interruption or shuffling.

### Late night listening

Quiet, mellow tracks for when you don't want to disturb anyone:

```
play jazz ballads
turn on shuffle
turn on repeat
set volume to 20
```

Low volume, soft music, shuffled but continuous.

### Exploration by genre

Discovering what you have in a specific genre:

```
play blues
turn on random
turn on consume
set volume to 50
```

Random blues tracks, each removed after playing, so you cycle through your collection.

### Road trip mode

Long, continuous playback with variety:

```
play rock
add some folk
queue blues
turn on shuffle
turn on repeat
set volume to 70
```

Mixed genres, shuffled, looping so you never run out.

---

## Final thoughts

This guide shows hundreds of command variations, but you don't need to memorize any of it. The AI understands natural language, which means you can talk to it however feels intuitive.

If something doesn't work, try rephrasing. If "play" doesn't do what you expected, try "search" or "queue" or "add." The AI has access to a limited set of tools, so some requests translate cleanly while others require interpretation.

Your library's metadata matters more than perfect command phrasing. If your files aren't tagged with artist, album, genre, and year, Conductor can't search them effectively. Spend time organizing your library with proper tags and you'll get much better results.

The AI keeps context for about 10 messages, so you can have short conversations. After that, history gets pruned and it forgets earlier context. Start fresh if you notice it's not remembering what you said a few minutes ago.

Different AI models behave differently. Claude tends to be chatty and explanatory. Llama is terser. GPT-4 is somewhere in between. If you don't like how your current model responds, switch providers in your `.env` file and see if another works better for you.

This is a music player that understands language, not a perfect mind-reading assistant. It's going to misunderstand sometimes, especially with vague or complex requests. That's fine. Just try again with clearer words.

Enjoy your music.
