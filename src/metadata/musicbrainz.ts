/**
 * Metadata Module
 * Handles music metadata enrichment using MusicBrainz API
 */

import type { TrackInfo } from '../mpd/client';

export interface ArtistInfo {
  id: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  type?: string;
  gender?: string;
  country?: string;
  lifeSpan?: {
    begin?: string;
    end?: string;
  };
}

export interface ReleaseInfo {
  id: string;
  title: string;
  date?: string;
  country?: string;
  barcode?: string;
  status?: string;
  artistCredit?: Array<{
    name: string;
    artist: ArtistInfo;
  }>;
  coverArtUrl?: string;
}

export interface EnrichedTrack extends TrackInfo {
  artistInfo?: ArtistInfo;
  releaseInfo?: ReleaseInfo;
}

// MusicBrainz API response types
interface MBArtistResponse {
  artists?: Array<{
    id: string;
    name: string;
    'sort-name'?: string;
    disambiguation?: string;
    type?: string;
    gender?: string;
    country?: string;
    'life-span'?: {
      begin?: string;
      end?: string;
    };
  }>;
}

interface MBReleaseResponse {
  releases?: Array<{
    id: string;
    title: string;
    date?: string;
    country?: string;
    barcode?: string;
    status?: string;
    'artist-credit'?: Array<{
      name: string;
      artist: {
        id: string;
        name: string;
        'sort-name'?: string;
      };
    }>;
  }>;
}

interface MBCoverArtResponse {
  images?: Array<{
    front?: boolean;
    image?: string;
    thumbnails?: {
      small?: string;
      large?: string;
    };
  }>;
}

/**
 * MusicBrainz API Client
 * Provides metadata enrichment for tracks
 */
export class MusicBrainzClient {
  private baseURL = 'https://musicbrainz.org/ws/2';
  private coverArtURL = 'https://coverartarchive.org';
  private cache: Map<string, any> = new Map();
  private userAgent = 'Conductor/0.1.0 (https://github.com/shelbeely/Conductor)';

  /**
   * Search for an artist by name
   */
  async searchArtist(artistName: string): Promise<ArtistInfo | null> {
    const cacheKey = `artist:${artistName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      await this.rateLimit();
      
      const response = await fetch(
        `${this.baseURL}/artist/?query=${encodeURIComponent(artistName)}&fmt=json`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as MBArtistResponse;
      const artist = data.artists?.[0];

      if (!artist) return null;

      const artistInfo: ArtistInfo = {
        id: artist.id,
        name: artist.name,
        sortName: artist['sort-name'],
        disambiguation: artist.disambiguation,
        type: artist.type,
        gender: artist.gender,
        country: artist.country,
        lifeSpan: artist['life-span'],
      };

      this.cache.set(cacheKey, artistInfo);
      return artistInfo;
    } catch (error) {
      console.error('Error searching artist:', error);
      return null;
    }
  }

  /**
   * Search for a release (album) by title and artist
   */
  async searchRelease(
    title: string,
    artist?: string
  ): Promise<ReleaseInfo | null> {
    const cacheKey = `release:${title}:${artist}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      await this.rateLimit();

      let query = `release:"${title}"`;
      if (artist) {
        query += ` AND artist:"${artist}"`;
      }

      const response = await fetch(
        `${this.baseURL}/release/?query=${encodeURIComponent(query)}&fmt=json`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as MBReleaseResponse;
      const release = data.releases?.[0];

      if (!release) return null;

      const releaseInfo: ReleaseInfo = {
        id: release.id,
        title: release.title,
        date: release.date,
        country: release.country,
        barcode: release.barcode,
        status: release.status,
        artistCredit: release['artist-credit']?.map((ac: any) => ({
          name: ac.name,
          artist: {
            id: ac.artist.id,
            name: ac.artist.name,
            sortName: ac.artist['sort-name'],
          },
        })),
      };

      // Try to get cover art
      try {
        const coverArt = await this.getCoverArt(release.id);
        if (coverArt) {
          releaseInfo.coverArtUrl = coverArt;
        }
      } catch {
        // Cover art not available
      }

      this.cache.set(cacheKey, releaseInfo);
      return releaseInfo;
    } catch (error) {
      console.error('Error searching release:', error);
      return null;
    }
  }

  /**
   * Get cover art URL for a release
   */
  async getCoverArt(releaseId: string): Promise<string | null> {
    const cacheKey = `coverart:${releaseId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.coverArtURL}/release/${releaseId}`,
        {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as MBCoverArtResponse;
      const frontCover = data.images?.find((img) => img.front);
      const coverUrl = frontCover?.thumbnails?.small || frontCover?.image;

      this.cache.set(cacheKey, coverUrl);
      return coverUrl || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Enrich a track with metadata from MusicBrainz
   */
  async enrichTrack(track: TrackInfo): Promise<EnrichedTrack> {
    const enriched: EnrichedTrack = { ...track };

    // Get artist info
    if (track.artist || track.albumArtist) {
      const artistName = track.albumArtist || track.artist;
      if (artistName) {
        const artistInfo = await this.searchArtist(artistName);
        if (artistInfo) {
          enriched.artistInfo = artistInfo;
        }
      }
    }

    // Get release info
    if (track.album && (track.artist || track.albumArtist)) {
      const artistName = track.albumArtist || track.artist;
      const releaseInfo = await this.searchRelease(track.album, artistName);
      if (releaseInfo) {
        enriched.releaseInfo = releaseInfo;
      }
    }

    return enriched;
  }

  /**
   * Fuzzy match track with MusicBrainz data
   * Useful for matching local files with online metadata
   */
  async fuzzyMatchTrack(track: TrackInfo): Promise<EnrichedTrack> {
    // Simple fuzzy matching - clean up common variations
    const cleanTitle = track.title?.replace(/[^\w\s]/g, '').toLowerCase();
    const cleanArtist = track.artist?.replace(/[^\w\s]/g, '').toLowerCase();

    // For now, just use regular enrichment
    // In a full implementation, you'd implement more sophisticated matching
    return this.enrichTrack(track);
  }

  /**
   * Rate limiting to respect MusicBrainz API guidelines (1 request/second)
   */
  private lastRequestTime = 0;
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000; // 1 second

    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
