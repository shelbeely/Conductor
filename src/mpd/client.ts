/**
 * MPD Client Module
 * Manages connection and communication with Music Player Daemon
 */

import { MPC } from 'mpc-js';

export interface MPDConfig {
  host: string;
  port: number;
}

export interface TrackInfo {
  file: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  track?: string;
  date?: string;
  genre?: string;
  time?: number;
  pos?: number;
  id?: number;
}

export interface PlayerStatus {
  state: 'play' | 'pause' | 'stop';
  volume: number;
  repeat: boolean;
  random: boolean;
  single: boolean;
  consume: boolean;
  song?: number;
  songid?: number;
  time?: string;
  elapsed?: number;
  duration?: number;
  bitrate?: number;
}

export class MPDClient {
  private mpc: MPC | null;
  private config: MPDConfig;
  private connected: boolean = false;
  private reconnectTimer?: Timer;

  constructor(config: MPDConfig = { host: 'localhost', port: 6600 }) {
    this.config = config;
    this.mpc = null;
  }

  async connect(): Promise<void> {
    try {
      this.mpc = new MPC();
      await this.mpc.connectTCP(this.config.host, this.config.port);
      this.connected = true;
      
      // Handle disconnection
      this.mpc.on('close', () => {
        this.connected = false;
        this.scheduleReconnect();
      });
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to MPD: ${error}`);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectTimer = undefined;
      } catch (error) {
        this.scheduleReconnect();
      }
    }, 5000);
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getCurrentSong(): Promise<TrackInfo | null> {
    if (!this.connected || !this.mpc) return null;
    try {
      const status = await this.mpc.status.status();
      if (status.song !== undefined) {
        const songs = await this.mpc.currentPlaylist.playlistInfo();
        return (songs[status.song] as any) || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current song:', error);
      return null;
    }
  }

  async getStatus(): Promise<PlayerStatus | null> {
    if (!this.connected || !this.mpc) return null;
    try {
      const status = await this.mpc.status.status();
      return {
        state: status.state || 'stop',
        volume: status.volume || 0,
        repeat: status.repeat || false,
        random: status.random || false,
        single: status.single === 'oneshot' || status.single === true,
        consume: status.consume || false,
        song: status.song,
        songid: status.songId,
        elapsed: status.elapsed,
        duration: status.duration,
        bitrate: status.bitRate,
      } as PlayerStatus;
    } catch (error) {
      console.error('Error getting status:', error);
      return null;
    }
  }

  async play(pos?: number): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playback.play(pos);
    } catch (error) {
      console.error('Error playing:', error);
    }
  }

  async pause(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playback.pause(true);
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playback.stop();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  }

  async next(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playback.next();
    } catch (error) {
      console.error('Error skipping to next:', error);
    }
  }

  async previous(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playback.previous();
    } catch (error) {
      console.error('Error going to previous:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.playbackOptions.setVolume(Math.max(0, Math.min(100, volume)));
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  async toggleRepeat(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      const status = await this.getStatus();
      if (status) {
        await this.mpc.playbackOptions.setRepeat(!status.repeat);
      }
    } catch (error) {
      console.error('Error toggling repeat:', error);
    }
  }

  async toggleRandom(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      const status = await this.getStatus();
      if (status) {
        await this.mpc.playbackOptions.setRandom(!status.random);
      }
    } catch (error) {
      console.error('Error toggling random:', error);
    }
  }

  async getQueue(): Promise<TrackInfo[]> {
    if (!this.connected || !this.mpc) return [];
    try {
      const queue = await this.mpc.currentPlaylist.playlistInfo();
      return (queue || []) as any;
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  }

  async clearQueue(): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.currentPlaylist.clear();
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  async addToQueue(uri: string): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.currentPlaylist.add(uri);
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  async removeFromQueue(pos: number): Promise<void> {
    if (!this.connected || !this.mpc) return;
    try {
      await this.mpc.currentPlaylist.delete(pos);
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  }

  async search(type: string, query: string): Promise<TrackInfo[]> {
    if (!this.connected || !this.mpc) return [];
    try {
      const results = await this.mpc.database.search([[type, query]]);
      return (results || []) as any;
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }

  async listAll(path?: string): Promise<TrackInfo[]> {
    if (!this.connected || !this.mpc) return [];
    try {
      const results = await this.mpc.database.listAll(path);
      return (results || []) as any;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.mpc) {
      this.mpc.disconnect();
    }
    this.connected = false;
  }
}
