/**
 * Album Art Module
 * Displays album art using Überzug++ with graceful fallback
 */

import { spawn, type ChildProcess } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface ArtDisplayConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Album Art Manager
 * Handles displaying album art with Überzug++ or fallback to ASCII/skip
 */
export class AlbumArtManager {
  private ueberzugProcess: ChildProcess | null = null;
  private isUeberzugAvailable = false;
  private currentImagePath: string | null = null;
  private identifier = 'conductor-cover';

  async initialize(): Promise<void> {
    // Check if ueberzug++ is available
    this.isUeberzugAvailable = await this.checkUeberzug();
    
    if (this.isUeberzugAvailable) {
      await this.startUeberzug();
    }
  }

  /**
   * Check if Überzug++ is installed
   */
  private async checkUeberzug(): Promise<boolean> {
    try {
      const process = spawn('which', ['ueberzug']);
      return new Promise((resolve) => {
        process.on('close', (code) => {
          resolve(code === 0);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Start Überzug++ process
   */
  private async startUeberzug(): Promise<void> {
    if (!this.isUeberzugAvailable) return;

    try {
      this.ueberzugProcess = spawn('ueberzug', ['layer', '--parser', 'json']);
      
      if (!this.ueberzugProcess.stdin) {
        throw new Error('Failed to get stdin for ueberzug process');
      }

      this.ueberzugProcess.on('error', (error) => {
        console.error('Ueberzug error:', error);
        this.isUeberzugAvailable = false;
      });
    } catch (error) {
      console.error('Failed to start ueberzug:', error);
      this.isUeberzugAvailable = false;
    }
  }

  /**
   * Display album art from a URL or file path
   */
  async displayArt(
    imageSource: string,
    config: ArtDisplayConfig
  ): Promise<boolean> {
    if (!this.isUeberzugAvailable || !this.ueberzugProcess?.stdin) {
      return false;
    }

    try {
      // If it's a URL, download it first
      let imagePath = imageSource;
      if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
        imagePath = await this.downloadImage(imageSource);
      }

      // Send display command to Überzug++
      const command = {
        action: 'add',
        identifier: this.identifier,
        x: config.x,
        y: config.y,
        width: config.width,
        height: config.height,
        path: imagePath,
      };

      this.ueberzugProcess.stdin.write(JSON.stringify(command) + '\n');
      this.currentImagePath = imagePath;
      
      return true;
    } catch (error) {
      console.error('Error displaying art:', error);
      return false;
    }
  }

  /**
   * Download image from URL to temp file
   */
  private async downloadImage(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const tempPath = join(tmpdir(), `conductor-${Date.now()}.jpg`);
    
    await writeFile(tempPath, Buffer.from(buffer));
    return tempPath;
  }

  /**
   * Hide currently displayed album art
   */
  async hideArt(): Promise<void> {
    if (!this.isUeberzugAvailable || !this.ueberzugProcess?.stdin) {
      return;
    }

    try {
      const command = {
        action: 'remove',
        identifier: this.identifier,
      };

      this.ueberzugProcess.stdin.write(JSON.stringify(command) + '\n');

      // Clean up temp file
      if (this.currentImagePath?.includes(tmpdir())) {
        await unlink(this.currentImagePath).catch(() => {});
      }
      
      this.currentImagePath = null;
    } catch (error) {
      console.error('Error hiding art:', error);
    }
  }

  /**
   * Generate ASCII art fallback for terminals without Überzug++
   */
  generateAsciiArt(title: string, artist: string): string {
    const width = 30;
    const height = 15;
    
    const border = '─'.repeat(width);
    const empty = ' '.repeat(width);
    
    const lines = [
      `┌${border}┐`,
      ...Array(3).fill(`│${empty}│`),
      `│${this.centerText('♫', width)}│`,
      ...Array(2).fill(`│${empty}│`),
      `│${this.centerText(this.truncate(title, width - 2), width)}│`,
      `│${this.centerText(this.truncate(artist, width - 2), width)}│`,
      ...Array(height - 9).fill(`│${empty}│`),
      `└${border}┘`,
    ];

    return lines.join('\n');
  }

  private centerText(text: string, width: number): string {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Check if Überzug++ is available
   */
  isAvailable(): boolean {
    return this.isUeberzugAvailable;
  }

  /**
   * Cleanup and stop Überzug++ process
   */
  async cleanup(): Promise<void> {
    await this.hideArt();
    
    if (this.ueberzugProcess) {
      this.ueberzugProcess.stdin?.end();
      this.ueberzugProcess.kill();
      this.ueberzugProcess = null;
    }
  }
}
