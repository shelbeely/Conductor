/**
 * LRC Lyrics Client
 * Fetches synced lyrics from lrclib.net API
 */

export interface LyricsLine {
  time: number; // Time in seconds
  text: string;
}

export interface LyricsData {
  id?: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  plainLyrics?: string;
  syncedLyrics?: string;
  parsedLines?: LyricsLine[];
}

export class LRCLibClient {
  private baseUrl = 'https://lrclib.net/api';
  private cache: Map<string, LyricsData> = new Map();

  /**
   * Search for lyrics by track info
   */
  async getLyrics(
    trackName: string,
    artistName: string,
    albumName?: string,
    duration?: number
  ): Promise<LyricsData | null> {
    const cacheKey = `${artistName}-${trackName}`.toLowerCase();
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
      });

      if (albumName) {
        params.append('album_name', albumName);
      }
      if (duration) {
        params.append('duration', Math.floor(duration).toString());
      }

      const response = await fetch(`${this.baseUrl}/get?${params.toString()}`, {
        headers: {
          'User-Agent': 'Conductor Music Player (https://github.com/shelbeely/Conductor)',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No lyrics found
        }
        throw new Error(`LRCLib API error: ${response.status}`);
      }

      const data = await response.json();
      
      const lyricsData: LyricsData = {
        id: data.id,
        trackName: data.trackName || trackName,
        artistName: data.artistName || artistName,
        albumName: data.albumName,
        duration: data.duration,
        plainLyrics: data.plainLyrics,
        syncedLyrics: data.syncedLyrics,
      };

      // Parse synced lyrics if available
      if (data.syncedLyrics) {
        lyricsData.parsedLines = this.parseLRC(data.syncedLyrics);
      }

      this.cache.set(cacheKey, lyricsData);
      return lyricsData;
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
      return null;
    }
  }

  /**
   * Parse LRC format into structured lines
   * Format: [mm:ss.xx]Lyric text
   */
  private parseLRC(lrcText: string): LyricsLine[] {
    const lines: LyricsLine[] = [];
    const lrcLines = lrcText.split('\n');

    for (const line of lrcLines) {
      // Match timestamp pattern [mm:ss.xx]
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.+)/);
      if (match) {
        const [, minutes, seconds, centiseconds, text] = match;
        const time =
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(centiseconds) / 100;
        
        lines.push({
          time,
          text: text.trim(),
        });
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  }

  /**
   * Get the current lyric line based on playback position
   */
  getCurrentLine(lyrics: LyricsData, currentTime: number): LyricsLine | null {
    if (!lyrics.parsedLines || lyrics.parsedLines.length === 0) {
      return null;
    }

    // Find the line that should be displayed at current time
    for (let i = lyrics.parsedLines.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.parsedLines[i].time) {
        return lyrics.parsedLines[i];
      }
    }

    return null;
  }

  /**
   * Get upcoming lyrics lines for preview
   */
  getUpcomingLines(
    lyrics: LyricsData,
    currentTime: number,
    count: number = 3
  ): LyricsLine[] {
    if (!lyrics.parsedLines || lyrics.parsedLines.length === 0) {
      return [];
    }

    const currentIndex = lyrics.parsedLines.findIndex(
      (line) => line.time > currentTime
    );

    if (currentIndex === -1) {
      return [];
    }

    return lyrics.parsedLines.slice(currentIndex, currentIndex + count);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
