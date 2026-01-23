# YouTube Music with Album Art Support

This guide explains how to add YouTube Music streaming with comprehensive album art support to Conductor, working around Mopidy's protocol limitations.

## The Challenge

Mopidy's MPD implementation doesn't support album art commands (`albumart`, `readpicture`), which means TUI clients like Conductor can't display cover art when using Mopidy for YouTube Music streaming. This is a fundamental protocol limitation (see [mopidy/mopidy-mpd#68](https://github.com/mopidy/mopidy-mpd/issues/68)).

## The Solution: Multi-Source Album Art System

Instead of relying on MPD protocol commands, we build a parallel album art system that fetches covers from multiple sources based on track metadata.

### Architecture Overview

```
┌─────────────┐
│  Conductor  │
└──────┬──────┘
       │
       ├──► MPD/Mopidy (playback + metadata)
       │
       └──► Album Art Service (parallel)
            │
            ├──► YouTube Music thumbnails (primary for YTM tracks)
            ├──► MusicBrainz + Cover Art Archive (canonical source)
            ├──► Deezer API (fast, keyless, high-res)
            ├──► Fanart.tv (high quality artist/album art)
            ├──► Spotify API (extensive coverage)
            └──► Local cache
```

## Implementation Strategy

### Phase 1: Album Art Fetcher Module

Create `src/albumart/fetcher.ts` that:

1. **Detects track source** - Identifies if track is from YouTube Music, local file, or other source
2. **Uses smart fallback chain** - Queries multiple sources in priority order
3. **Caches aggressively** - Stores results locally to minimize API calls
4. **Provides multiple resolutions** - Returns small (200x200), medium (500x500), large (1000x1000)

### Phase 2: Source Implementations

#### 1. YouTube Music Thumbnails (Primary for YTM)

**When to use:** Track is from mopidy-ytmusic

**Implementation:**
```typescript
// src/albumart/sources/youtube.ts
export async function fetchYouTubeThumbnail(videoId: string): Promise<AlbumArt> {
  // YouTube Music provides thumbnails in multiple resolutions
  const sizes = [
    { url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, size: 1280 },
    { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, size: 480 },
    { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, size: 320 },
  ];
  
  // Try highest quality first, fallback to lower
  for (const thumb of sizes) {
    if (await checkImageExists(thumb.url)) {
      return { url: thumb.url, width: thumb.size, source: 'youtube' };
    }
  }
  
  return null;
}
```

**Benefits:**
- Direct access to YouTube's CDN
- No API key required
- Instant availability
- Multiple resolutions

**Limitations:**
- Quality varies (user-uploaded content)
- May be low-res for older uploads
- Not always square/proper album art

#### 2. MusicBrainz + Cover Art Archive (Canonical)

**When to use:** Have artist + album name, or MBID

**Implementation:**
```typescript
// src/albumart/sources/musicbrainz.ts
export async function fetchFromMusicBrainz(
  artist: string,
  album: string
): Promise<AlbumArt> {
  // 1. Search MusicBrainz for release
  const mbid = await searchRelease(artist, album);
  
  if (!mbid) return null;
  
  // 2. Fetch from Cover Art Archive
  const response = await fetch(
    `https://coverartarchive.org/release/${mbid}/front`
  );
  
  if (response.ok) {
    return {
      url: response.url,
      mbid: mbid,
      source: 'coverartarchive'
    };
  }
  
  return null;
}
```

**Benefits:**
- Open, community-maintained database
- Canonical source for official releases
- No API key required
- High quality scans

**Limitations:**
- May not have newer or obscure releases
- Requires artist/album matching
- Rate limiting (1 request/second recommended)

#### 3. Deezer API (Fast Fallback)

**When to use:** MusicBrainz/YouTube don't have art

**Implementation:**
```typescript
// src/albumart/sources/deezer.ts
export async function fetchFromDeezer(
  artist: string,
  album: string
): Promise<AlbumArt> {
  // Deezer search API (no key required)
  const query = encodeURIComponent(`${artist} ${album}`);
  const response = await fetch(
    `https://api.deezer.com/search/album?q=${query}&limit=1`
  );
  
  const data = await response.json();
  
  if (data.data && data.data.length > 0) {
    const cover = data.data[0].cover_xl; // 1000x1000
    return {
      url: cover,
      width: 1000,
      source: 'deezer'
    };
  }
  
  return null;
}
```

**Benefits:**
- No API key required
- Fast responses
- High-res images (up to 1000x1000)
- Good coverage of popular music

**Limitations:**
- May not have very obscure tracks
- Sometimes returns wrong album

#### 4. Fanart.tv (High Quality Art)

**When to use:** Need high-quality artist/album art

**Implementation:**
```typescript
// src/albumart/sources/fanart.ts
export async function fetchFromFanart(
  mbid: string, // MusicBrainz ID
  apiKey: string
): Promise<AlbumArt> {
  const response = await fetch(
    `https://webservice.fanart.tv/v3/music/${mbid}?api_key=${apiKey}`
  );
  
  const data = await response.json();
  
  // Prefer album covers, then CD art
  const art = data.albums?.[0]?.albumcover?.[0] ||
              data.albums?.[0]?.cdart?.[0];
  
  if (art) {
    return {
      url: art.url,
      source: 'fanart.tv'
    };
  }
  
  return null;
}
```

**Benefits:**
- Highest quality artwork
- Artist-level and album-level art
- Community curated
- Multiple art types (covers, logos, backgrounds)

**Limitations:**
- Requires free API key
- Rate limited
- Not all releases covered

#### 5. Spotify API (Extensive Coverage)

**When to use:** Other sources failed

**Implementation:**
```typescript
// src/albumart/sources/spotify.ts
export async function fetchFromSpotify(
  artist: string,
  album: string,
  accessToken: string
): Promise<AlbumArt> {
  // Search for album
  const query = encodeURIComponent(`artist:${artist} album:${album}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  );
  
  const data = await response.json();
  
  if (data.albums?.items?.length > 0) {
    const images = data.albums.items[0].images;
    // Return largest image
    const largest = images.sort((a, b) => b.width - a.width)[0];
    return {
      url: largest.url,
      width: largest.width,
      source: 'spotify'
    };
  }
  
  return null;
}
```

**Benefits:**
- Extremely extensive catalog
- Multiple image sizes
- High quality
- Very accurate matching

**Limitations:**
- Requires OAuth authentication
- Token refresh needed
- API rate limits
- Terms of service restrictions

### Phase 3: Smart Fallback Chain

```typescript
// src/albumart/fetcher.ts
export async function fetchAlbumArt(track: Track): Promise<AlbumArt | null> {
  const cacheKey = `${track.artist}-${track.album}`;
  
  // 1. Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // 2. Try YouTube Music thumbnails if track is from YTM
  if (track.file?.includes('youtube') || track.file?.includes('ytmusic')) {
    const ytArt = await fetchYouTubeThumbnail(extractVideoId(track.file));
    if (ytArt) {
      await cache.set(cacheKey, ytArt);
      return ytArt;
    }
  }
  
  // 3. Try MusicBrainz + Cover Art Archive
  const mbArt = await fetchFromMusicBrainz(track.artist, track.album);
  if (mbArt) {
    await cache.set(cacheKey, mbArt);
    return mbArt;
  }
  
  // 4. Try Deezer (fast, keyless)
  const deezerArt = await fetchFromDeezer(track.artist, track.album);
  if (deezerArt) {
    await cache.set(cacheKey, deezerArt);
    return deezerArt;
  }
  
  // 5. Try Fanart.tv if we have MBID (requires API key)
  if (config.fanartApiKey && mbArt?.mbid) {
    const fanartArt = await fetchFromFanart(mbArt.mbid, config.fanartApiKey);
    if (fanartArt) {
      await cache.set(cacheKey, fanartArt);
      return fanartArt;
    }
  }
  
  // 6. Try Spotify (requires auth)
  if (config.spotifyAccessToken) {
    const spotifyArt = await fetchFromSpotify(
      track.artist,
      track.album,
      config.spotifyAccessToken
    );
    if (spotifyArt) {
      await cache.set(cacheKey, spotifyArt);
      return spotifyArt;
    }
  }
  
  // 7. No art found
  return null;
}
```

## Configuration

Add to `.env`:

```bash
# Album Art Configuration
ALBUM_ART_CACHE_DIR=~/.cache/conductor/albumart
ALBUM_ART_CACHE_TTL=2592000  # 30 days in seconds

# Optional API keys for additional sources
FANART_API_KEY=your_fanart_api_key  # Get at fanart.tv
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Caching Strategy

### Local File Cache

```typescript
// src/albumart/cache.ts
export class AlbumArtCache {
  private cacheDir: string;
  
  async get(key: string): Promise<AlbumArt | null> {
    const cachePath = path.join(this.cacheDir, `${hash(key)}.json`);
    const metaPath = path.join(this.cacheDir, `${hash(key)}.meta.json`);
    
    if (!await fs.exists(cachePath)) return null;
    
    // Check if expired
    const meta = await fs.readJSON(metaPath);
    if (Date.now() > meta.expiresAt) {
      await this.delete(key);
      return null;
    }
    
    return await fs.readJSON(cachePath);
  }
  
  async set(key: string, art: AlbumArt, ttl: number = 2592000): Promise<void> {
    const cachePath = path.join(this.cacheDir, `${hash(key)}.json`);
    const metaPath = path.join(this.cacheDir, `${hash(key)}.meta.json`);
    
    await fs.writeJSON(cachePath, art);
    await fs.writeJSON(metaPath, {
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      source: art.source
    });
  }
}
```

### Benefits of This Approach

1. **Works with any MPD/Mopidy setup** - Doesn't rely on MPD protocol
2. **Multiple fallback sources** - High success rate for finding art
3. **YouTube Music optimized** - Direct thumbnail access for YTM tracks
4. **Efficient caching** - Minimizes API calls
5. **Configurable** - Users can enable/disable sources
6. **Quality control** - Prioritizes high-res images
7. **No protocol limitations** - Bypasses Mopidy's MPD limitations

## UI Integration

### Display Album Art in TUI

```typescript
// src/ui/AlbumArt.tsx
import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { fetchAlbumArt } from '../albumart/fetcher';
import terminalImage from 'terminal-image';

export const AlbumArt: React.FC<{ track: Track }> = ({ track }) => {
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [ascii, setAscii] = useState<string>('');
  
  useEffect(() => {
    const loadArt = async () => {
      const art = await fetchAlbumArt(track);
      if (art) {
        setArtUrl(art.url);
        // Convert to ASCII/sixel for terminal display
        const image = await downloadImage(art.url);
        const terminal = await terminalImage.buffer(image, { width: 40 });
        setAscii(terminal);
      }
    };
    
    loadArt();
  }, [track.artist, track.album]);
  
  if (!ascii) {
    return (
      <Box borderStyle="round" padding={1}>
        <Text dimColor>No album art</Text>
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column">
      <Text>{ascii}</Text>
      <Text dimColor>Source: {artUrl ? new URL(artUrl).hostname : 'cache'}</Text>
    </Box>
  );
};
```

## Performance Considerations

1. **Parallel requests** - Try multiple sources simultaneously (with Promise.race)
2. **Request timeouts** - Set 5-second timeout per source
3. **Image resizing** - Cache multiple sizes locally
4. **Lazy loading** - Only fetch art when needed
5. **Background updates** - Refresh stale cache entries asynchronously

## Rate Limiting

```typescript
// src/albumart/ratelimit.ts
export class RateLimiter {
  private limits = new Map<string, { count: number; resetAt: number }>();
  
  async checkLimit(source: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const limit = this.limits.get(source);
    
    if (!limit || now > limit.resetAt) {
      this.limits.set(source, { count: 1, resetAt: now + windowMs });
      return true;
    }
    
    if (limit.count >= maxRequests) {
      return false; // Rate limited
    }
    
    limit.count++;
    return true;
  }
}
```

**Recommended limits:**
- MusicBrainz: 1 req/second (per their ToS)
- Cover Art Archive: 1 req/second
- Deezer: 50 req/5 seconds (unofficial, be conservative)
- Fanart.tv: 2 req/second with API key
- Spotify: Follow their rate limit headers
- YouTube: No hard limit, but be reasonable

## Testing Strategy

1. **Unit tests** - Test each source fetcher independently
2. **Integration tests** - Test fallback chain
3. **Cache tests** - Verify caching behavior
4. **Mock APIs** - Use fixtures for predictable testing
5. **Real-world tests** - Test with actual YouTube Music tracks

## Future Enhancements

1. **Machine learning** - Learn which source is best for specific artists/genres
2. **User uploads** - Allow users to supply custom art
3. **Playlist art** - Generate collages for playlists
4. **Artist photos** - Fetch artist images in addition to album art
5. **Animated covers** - Support for GIF/video covers where available
6. **Community submissions** - Allow users to submit missing art

## Summary

This multi-source album art system solves Mopidy's protocol limitations by:
- Fetching art through parallel HTTP APIs instead of MPD commands
- Using YouTube Music thumbnails as primary source for YTM tracks
- Falling back to MusicBrainz, Deezer, Fanart.tv, and Spotify
- Caching aggressively to minimize API calls
- Providing high-quality covers regardless of streaming source

The result is a robust album art experience that works with YouTube Music through Mopidy, despite the missing MPD protocol support.
