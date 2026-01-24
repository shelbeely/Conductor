#!/usr/bin/env node

/**
 * Interactive Setup Wizard for Conductor
 * Guides users through installing and configuring required dependencies
 * Designed to be fun, engaging, and neurodivergent-friendly
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import readline from 'readline';

const execAsync = promisify(exec);

// ASCII Art and Visual Elements
const ASCII_ART = {
  logo: `
    ♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸
    
       ██████╗ ██████╗ ███╗   ██╗██████╗ 
      ██╔════╝██╔═══██╗████╗  ██║██╔══██╗
      ██║     ██║   ██║██╔██╗ ██║██║  ██║
      ██║     ██║   ██║██║╚██╗██║██║  ██║
      ╚██████╗╚██████╔╝██║ ╚████║██████╔╝
       ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ 
      
       ██╗   ██╗ ██████╗████████╗ ██████╗ ██████╗ 
       ██║   ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗
       ██║   ██║██║        ██║   ██║   ██║██████╔╝
       ██║   ██║██║        ██║   ██║   ██║██╔══██╗
       ╚██████╔╝╚██████╗   ██║   ╚██████╔╝██║  ██║
        ╚═════╝  ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝
    
    ♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸♪♫•*¨*•.¸¸
  `,
  music: `
      ♪ ♫ ♪ ♫
     ♫ ♪ ♫ ♪ ♫
    ♪ ♫ ♪ ♫ ♪ ♫
  `,
  robot: `
     ╔═══╗
     ║ ◉ ║  Hi! I'm here to help!
     ╚═══╝
      ║ ║
     ╔═══╗
  `,
  checkmark: '✓',
  crossmark: '✗',
  arrow: '→',
  star: '★',
  loading: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  progress: ['▱▱▱▱▱', '▰▱▱▱▱', '▰▰▱▱▱', '▰▰▰▱▱', '▰▰▰▰▱', '▰▰▰▰▰'],
  celebration: `
    ✨ 🎉 ✨ 🎊 ✨ 🎉 ✨
       🎵 SUCCESS! 🎵
    ✨ 🎊 ✨ 🎉 ✨ 🎊 ✨
  `,
};

// Color codes for terminal
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgCyan: '\x1b[46m',
  bgGreen: '\x1b[42m',
};

interface ComponentState {
  installed: boolean;
  configured: boolean;
  lastInstalled?: string;
}

interface SetupState {
  mpd: ComponentState;
  ollama: ComponentState;
  bark: ComponentState;
  ueberzug: ComponentState;
}

interface SetupStep {
  name: string;
  check: () => Promise<boolean>;
  install: () => Promise<void>;
  optional: boolean;
  description: string;
}

class SetupWizard {
  private rl: readline.Interface;
  private envConfig: Record<string, string> = {};
  private stateFile: string;
  private state: SetupState;
  private loadingInterval?: NodeJS.Timeout;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.stateFile = path.join(process.cwd(), '.conductor-setup-state.json');
    this.state = this.loadState();
  }

  private loadState(): SetupState {
    if (existsSync(this.stateFile)) {
      try {
        return JSON.parse(readFileSync(this.stateFile, 'utf-8'));
      } catch (error) {
        // Invalid state file, start fresh
      }
    }
    return {
      mpd: { installed: false, configured: false },
      ollama: { installed: false, configured: false },
      bark: { installed: false, configured: false },
      ueberzug: { installed: false, configured: false },
    };
  }

  private saveState(): void {
    writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  // Animation helpers
  private async showLoadingAnimation(message: string, durationMs: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      let i = 0;
      process.stdout.write(`\n${COLORS.cyan}`);
      
      this.loadingInterval = setInterval(() => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${ASCII_ART.loading[i % ASCII_ART.loading.length]} ${message}`);
        i++;
      }, 80);

      setTimeout(() => {
        if (this.loadingInterval) clearInterval(this.loadingInterval);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${COLORS.reset}`);
        resolve();
      }, durationMs);
    });
  }

  private async showProgressBar(steps: string[], delayMs: number = 500): Promise<void> {
    for (let i = 0; i < ASCII_ART.progress.length; i++) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      const step = steps[i] || steps[steps.length - 1];
      process.stdout.write(`${COLORS.green}${ASCII_ART.progress[i]}${COLORS.reset} ${step}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    process.stdout.write('\n');
  }

  private colorText(text: string, color: keyof typeof COLORS): string {
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  private async typeWriter(text: string, delayMs: number = 30): Promise<void> {
    for (const char of text) {
      process.stdout.write(char);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    process.stdout.write('\n');
  }

  private drawBox(title: string, content: string[], width: number = 60): void {
    const topBorder = '╔' + '═'.repeat(width - 2) + '╗';
    const bottomBorder = '╚' + '═'.repeat(width - 2) + '╝';
    const emptyLine = '║' + ' '.repeat(width - 2) + '║';
    
    console.log(this.colorText(topBorder, 'cyan'));
    
    // Title
    const titlePadding = Math.floor((width - 2 - title.length) / 2);
    const titleLine = '║' + ' '.repeat(titlePadding) + this.colorText(title, 'bright') + ' '.repeat(width - 2 - titlePadding - title.length) + '║';
    console.log(titleLine);
    console.log(this.colorText(emptyLine, 'cyan'));
    
    // Content
    content.forEach(line => {
      const padding = width - 4 - line.replace(/\x1b\[[0-9;]*m/g, '').length; // Account for color codes
      const contentLine = '║  ' + line + ' '.repeat(Math.max(0, padding)) + '║';
      console.log(this.colorText('║  ', 'cyan') + line + ' '.repeat(Math.max(0, padding)) + this.colorText('║', 'cyan'));
    });
    
    console.log(this.colorText(emptyLine, 'cyan'));
    console.log(this.colorText(bottomBorder, 'cyan'));
  }

  private async showMainMenu(): Promise<'install' | 'uninstall' | 'quit'> {
    console.clear();
    console.log(this.colorText(ASCII_ART.logo, 'cyan'));
    
    await this.showLoadingAnimation('Starting setup wizard...', 1000);
    
    console.log('\n');
    console.log(ASCII_ART.robot);
    console.log('');
    
    this.drawBox('🎵 WELCOME TO CONDUCTOR SETUP! 🎵', [
      'I\'m your friendly setup assistant!',
      '',
      'This wizard will help you:',
      `${ASCII_ART.star} Install music player (MPD)`,
      `${ASCII_ART.star} Set up AI features (Ollama)`,
      `${ASCII_ART.star} Add DJ voices (Bark TTS)`,
      `${ASCII_ART.star} Enable album art (Überzug++)`,
      '',
      this.colorText('✨ Designed to be neurodivergent-friendly! ✨', 'magenta'),
    ]);

    console.log('\n' + this.colorText('━━━ MAIN MENU ━━━', 'bright') + '\n');
    console.log(`  ${this.colorText('1', 'green')}. ${ASCII_ART.checkmark} Install/Configure components`);
    console.log(`  ${this.colorText('2', 'red')}. ${ASCII_ART.crossmark} Uninstall components`);
    console.log(`  ${this.colorText('Q', 'yellow')}. Exit wizard\n`);

    const choice = await this.question(this.colorText('Choose an option (1, 2, or Q): ', 'cyan'));

    if (choice.toLowerCase() === 'q') {
      return 'quit';
    } else if (choice === '1') {
      return 'install';
    } else if (choice === '2') {
      return 'uninstall';
    } else {
      console.log(this.colorText('\n⚠ Oops! That\'s not a valid option. Let\'s try again! ⚠\n', 'yellow'));
      await new Promise(resolve => setTimeout(resolve, 1500));
      return this.showMainMenu();
    }
  }

  private async selectComponents(mode: 'install' | 'uninstall'): Promise<Set<string>> {
    console.clear();
    const actionVerb = mode === 'install' ? 'install' : 'uninstall';
    const emoji = mode === 'install' ? '📦' : '🗑️';
    
    console.log(this.colorText(`\n━━━ ${emoji} COMPONENT SELECTION (${actionVerb.toUpperCase()}) ${emoji} ━━━\n`, 'bright'));
    
    const components = [
      {
        key: 'mpd',
        name: 'MPD (Music Player Daemon)',
        emoji: '🎵',
        description: 'Plays your music files',
        required: true,
        status: this.state.mpd.installed ? this.colorText('✓ Installed', 'green') : this.colorText('✗ Not installed', 'dim'),
        canUninstall: this.state.mpd.installed && mode === 'uninstall',
      },
      {
        key: 'ollama',
        name: 'Ollama (Local AI)',
        emoji: '🤖',
        description: 'Free local AI for natural language control',
        required: false,
        status: this.state.ollama.installed ? this.colorText('✓ Installed', 'green') : this.colorText('✗ Not installed', 'dim'),
        canUninstall: this.state.ollama.installed && mode === 'uninstall',
      },
      {
        key: 'bark',
        name: 'Bark TTS',
        emoji: '🗣️',
        description: 'AI DJ hosts with non-verbal sounds (laughs, sighs)',
        required: false,
        status: this.state.bark.installed ? this.colorText('✓ Installed', 'green') : this.colorText('✗ Not installed', 'dim'),
        canUninstall: this.state.bark.installed && mode === 'uninstall',
      },
      {
        key: 'ueberzug',
        name: 'Überzug++',
        emoji: '🖼️',
        description: 'Album art display in terminal',
        required: false,
        status: this.state.ueberzug.installed ? this.colorText('✓ Installed', 'green') : this.colorText('✗ Not installed', 'dim'),
        canUninstall: this.state.ueberzug.installed && mode === 'uninstall',
      },
    ];

    // Filter components based on mode
    const availableComponents = mode === 'uninstall' 
      ? components.filter(c => c.canUninstall)
      : components;

    if (mode === 'uninstall' && availableComponents.length === 0) {
      this.drawBox('ℹ️ INFO', [
        'No components are installed to uninstall.',
        '',
        'Press Enter to return to the main menu.'
      ]);
      await this.question('');
      return new Set();
    }

    this.drawBox(`Select components to ${actionVerb}:`, 
      availableComponents.map((comp, idx) => {
        const required = comp.required && mode === 'install' ? this.colorText('(Required)', 'yellow') : mode === 'install' ? this.colorText('(Optional)', 'dim') : '';
        return `${this.colorText((idx + 1).toString(), 'cyan')}. ${comp.emoji} ${comp.name} ${required}\n   [${comp.status}] ${comp.description}`;
      }).concat([
        '',
        mode === 'install' 
          ? `${this.colorText('A', 'green')}. ✨ Install ALL optional components`
          : `${this.colorText('A', 'red')}. 🗑️ Uninstall ALL components`,
        `${this.colorText('Q', 'yellow')}. ← Go back to main menu`
      ])
    );

    const selected = new Set<string>();

    if (mode === 'install') {
      // Always include MPD since it's required
      selected.add('mpd');
    }

    const choice = await this.question(this.colorText('\nEnter numbers (e.g., "1 2 4") or "A" for all, "Q" to go back: ', 'cyan'));

    if (choice.toLowerCase() === 'q') {
      return new Set();
    }

    if (choice.toLowerCase() === 'a') {
      // Select all
      availableComponents.forEach(comp => selected.add(comp.key));
    } else {
      // Parse individual selections
      const numbers = choice.split(/[\s,]+/).map(n => parseInt(n.trim()));
      numbers.forEach(num => {
        if (num >= 1 && num <= availableComponents.length) {
          selected.add(availableComponents[num - 1].key);
        }
      });
    }

    if (selected.size === 0) {
      console.log(this.colorText('\n⚠ No components selected.\n', 'yellow'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      return new Set();
    }

    // Confirm selection with visual feedback
    console.log('\n' + this.colorText('━━━ YOUR SELECTION ━━━', 'bright') + '\n');
    availableComponents.forEach(comp => {
      if (selected.has(comp.key)) {
        console.log(`  ${mode === 'install' ? this.colorText('✓', 'green') : this.colorText('✗', 'red')} ${comp.emoji} ${comp.name}`);
      }
    });
    console.log('');

    const confirmPrompt = mode === 'install' 
      ? this.colorText('🚀 Ready to install? (y/n): ', 'green')
      : this.colorText('⚠️ Ready to uninstall? (y/n): ', 'red');
    
    const confirm = await this.confirm(confirmPrompt.replace(' (y/n): ', ''));
    if (!confirm) {
      console.log(this.colorText('\n✋ Selection cancelled.\n', 'yellow'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      return new Set();
    }

    return selected;
  }

  private async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private async confirm(prompt: string): Promise<boolean> {
    const answer = await this.question(`${prompt} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const icons = {
      info: { symbol: 'ℹ', color: 'cyan' as keyof typeof COLORS },
      success: { symbol: '✓', color: 'green' as keyof typeof COLORS },
      error: { symbol: '✗', color: 'red' as keyof typeof COLORS },
      warn: { symbol: '⚠', color: 'yellow' as keyof typeof COLORS },
    };
    const icon = icons[type];
    console.log(`${this.colorText(icon.symbol, icon.color)} ${message}`);
  }

  private async detectOS(): Promise<'linux' | 'macos' | 'unknown'> {
    try {
      const { stdout } = await execAsync('uname');
      const os = stdout.trim().toLowerCase();
      if (os === 'linux') return 'linux';
      if (os === 'darwin') return 'macos';
    } catch (error) {
      // Ignore
    }
    return 'unknown';
  }

  private async detectPackageManager(): Promise<'apt' | 'pacman' | 'brew' | 'unknown'> {
    const managers = [
      { cmd: 'apt-get', name: 'apt' as const },
      { cmd: 'pacman', name: 'pacman' as const },
      { cmd: 'brew', name: 'brew' as const },
    ];

    for (const manager of managers) {
      try {
        await execAsync(`which ${manager.cmd}`);
        return manager.name;
      } catch (error) {
        // Manager not found
      }
    }
    return 'unknown';
  }

  private async runCommand(command: string, description?: string): Promise<void> {
    if (description) {
      this.log(description, 'info');
    }

    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        stdio: 'inherit',
      });

      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  private async checkCommand(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async setupMPD(): Promise<void> {
    this.log('Setting up MPD (Music Player Daemon)...', 'info');

    const mpdInstalled = await this.checkCommand('mpd');
    const mpcInstalled = await this.checkCommand('mpc');

    if (!mpdInstalled || !mpcInstalled) {
      const os = await this.detectOS();
      const pm = await this.detectPackageManager();

      this.log('MPD is not installed. Installing...', 'info');

      if (pm === 'apt') {
        await this.runCommand('sudo apt-get update && sudo apt-get install -y mpd mpc', 'Installing MPD with apt...');
      } else if (pm === 'pacman') {
        await this.runCommand('sudo pacman -S --noconfirm mpd mpc', 'Installing MPD with pacman...');
      } else if (pm === 'brew') {
        await this.runCommand('brew install mpd mpc', 'Installing MPD with Homebrew...');
      } else {
        this.log('Could not detect package manager. Please install MPD manually:', 'error');
        this.log('Ubuntu/Debian: sudo apt-get install mpd mpc', 'info');
        this.log('Arch Linux: sudo pacman -S mpd mpc', 'info');
        this.log('macOS: brew install mpd mpc', 'info');
        throw new Error('Manual installation required');
      }
    } else {
      this.log('MPD is already installed', 'success');
    }

    // Configure MPD
    const configDir = path.join(homedir(), '.config', 'mpd');
    const playlistDir = path.join(configDir, 'playlists');
    const musicDir = path.join(homedir(), 'Music');
    const configFile = path.join(configDir, 'mpd.conf');

    // Create directories
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    if (!existsSync(playlistDir)) {
      mkdirSync(playlistDir, { recursive: true });
    }
    if (!existsSync(musicDir)) {
      mkdirSync(musicDir, { recursive: true });
    }

    // Create config file if it doesn't exist
    if (!existsSync(configFile)) {
      const os = await this.detectOS();
      const audioOutput = os === 'macos'
        ? `audio_output {
    type  "osx"
    name  "CoreAudio"
}`
        : `audio_output {
    type  "pulse"
    name  "PulseAudio"
}`;

      const config = `music_directory    "${musicDir}"
playlist_directory "${playlistDir}"
db_file            "${configDir}/database"
log_file           "${configDir}/log"
pid_file           "${configDir}/pid"
state_file         "${configDir}/state"
sticker_file       "${configDir}/sticker.sql"

${audioOutput}

bind_to_address    "localhost"
port               "6600"
`;

      writeFileSync(configFile, config);
      this.log(`Created MPD configuration at ${configFile}`, 'success');
    } else {
      this.log('MPD configuration already exists', 'success');
    }

    // Start MPD
    try {
      await execAsync('mpd --version'); // Verify MPD works
      const os = await this.detectOS();

      if (os === 'linux') {
        // Try to enable and start systemd service
        try {
          await execAsync('systemctl --user enable mpd 2>/dev/null || true');
          await execAsync('systemctl --user start mpd 2>/dev/null || true');
          this.log('MPD systemd service enabled and started', 'success');
        } catch (error) {
          // Fallback to manual start
          await execAsync(`mpd ${configFile} 2>/dev/null || true`);
          this.log('MPD started manually', 'success');
        }
      } else {
        // macOS or other - start manually
        await execAsync(`mpd ${configFile} 2>/dev/null || true`);
        this.log('MPD started', 'success');
      }

      // Update database
      await execAsync('mpc update 2>/dev/null || true');
      this.log('MPD music database updated', 'success');
    } catch (error) {
      this.log('MPD may need to be started manually. Run: mpd', 'warn');
    }

    this.envConfig['MPD_HOST'] = 'localhost';
    this.envConfig['MPD_PORT'] = '6600';
    
    this.state.mpd.installed = true;
    this.state.mpd.configured = true;
    this.state.mpd.lastInstalled = new Date().toISOString();
    this.saveState();
  }

  private async uninstallMPD(): Promise<void> {
    this.log('Uninstalling MPD (Music Player Daemon)...', 'info');

    const os = await this.detectOS();
    
    // Stop MPD service
    try {
      if (os === 'linux') {
        await execAsync('systemctl --user stop mpd 2>/dev/null || true');
        await execAsync('systemctl --user disable mpd 2>/dev/null || true');
      }
      await execAsync('killall mpd 2>/dev/null || true');
      this.log('MPD service stopped', 'success');
    } catch (error) {
      // Ignore errors
    }

    const pm = await this.detectPackageManager();

    // Uninstall package
    try {
      if (pm === 'apt') {
        await this.runCommand('sudo apt-get remove -y mpd mpc', 'Uninstalling MPD...');
      } else if (pm === 'pacman') {
        await this.runCommand('sudo pacman -R --noconfirm mpd mpc', 'Uninstalling MPD...');
      } else if (pm === 'brew') {
        await this.runCommand('brew uninstall mpd mpc', 'Uninstalling MPD...');
      }
      this.log('MPD uninstalled', 'success');
    } catch (error) {
      this.log('Failed to uninstall MPD. You may need to uninstall manually.', 'warn');
    }

    // Ask if user wants to remove config
    const removeConfig = await this.confirm('Remove MPD configuration and database?');
    if (removeConfig) {
      const configDir = path.join(homedir(), '.config', 'mpd');
      try {
        await this.runCommand(`rm -rf ${configDir}`, 'Removing configuration...');
        this.log('MPD configuration removed', 'success');
      } catch (error) {
        this.log('Failed to remove configuration directory', 'warn');
      }
    }

    this.state.mpd.installed = false;
    this.state.mpd.configured = false;
    this.saveState();
  }

  private async setupOllama(): Promise<void> {
    this.log('Setting up Ollama (Local AI)...', 'info');

    const installed = await this.checkCommand('ollama');

    if (!installed) {
      this.log('Ollama is not installed. Installing...', 'info');
      await this.runCommand('curl -fsSL https://ollama.ai/install.sh | sh', 'Installing Ollama...');
    } else {
      this.log('Ollama is already installed', 'success');
    }

    // Check if service is running
    try {
      await execAsync('curl -s http://localhost:11434/api/tags');
      this.log('Ollama service is running', 'success');
    } catch (error) {
      this.log('Starting Ollama service...', 'info');
      // Start Ollama in background
      spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      }).unref();

      // Wait a bit for service to start
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Ask user which model to install
    this.log('Available models:', 'info');
    console.log('  1. llama3.2 (4.7GB) - Recommended, good balance');
    console.log('  2. mistral (4.1GB) - Fast and efficient');
    console.log('  3. qwen2.5:7b (4.7GB) - Good for music understanding');
    console.log('  4. Skip - I\'ll install a model later');

    const choice = await this.question('Choose a model (1-4): ');

    const models = {
      '1': 'llama3.2',
      '2': 'mistral',
      '3': 'qwen2.5:7b',
    };

    const selectedModel = models[choice as keyof typeof models];

    if (selectedModel) {
      this.log(`Pulling ${selectedModel}... (this may take a few minutes)`, 'info');
      await this.runCommand(`ollama pull ${selectedModel}`, `Downloading ${selectedModel}...`);
      this.log(`${selectedModel} installed successfully`, 'success');

      this.envConfig['AI_PROVIDER'] = 'ollama';
      this.envConfig['OLLAMA_BASE_URL'] = 'http://localhost:11434';
      this.envConfig['AI_MODEL'] = selectedModel;
    } else {
      this.log('Skipping model installation. You can run "ollama pull <model>" later.', 'warn');
    }

    this.state.ollama.installed = true;
    this.state.ollama.configured = true;
    this.state.ollama.lastInstalled = new Date().toISOString();
    this.saveState();
  }

  private async uninstallOllama(): Promise<void> {
    this.log('Uninstalling Ollama (Local AI)...', 'info');

    // Stop Ollama service
    try {
      await execAsync('killall ollama 2>/dev/null || true');
      this.log('Ollama service stopped', 'success');
    } catch (error) {
      // Ignore
    }

    // Uninstall Ollama
    try {
      const os = await this.detectOS();
      if (os === 'linux') {
        const pm = await this.detectPackageManager();
        if (pm === 'apt' || pm === 'pacman') {
          // Ollama doesn't have a package manager install on Linux, it's installed via script
          await this.runCommand('sudo rm -f /usr/local/bin/ollama /usr/bin/ollama', 'Removing Ollama binary...');
          await this.runCommand('sudo rm -rf /usr/share/ollama', 'Removing Ollama data...');
        }
      } else if (os === 'macos') {
        const pm = await this.detectPackageManager();
        if (pm === 'brew') {
          await this.runCommand('brew uninstall ollama', 'Uninstalling Ollama...');
        }
      }
      this.log('Ollama uninstalled', 'success');
    } catch (error) {
      this.log('Failed to uninstall Ollama. You may need to uninstall manually.', 'warn');
    }

    // Ask if user wants to remove models
    const removeModels = await this.confirm('Remove downloaded Ollama models (~4-5GB)?');
    if (removeModels) {
      const modelsDir = path.join(homedir(), '.ollama');
      try {
        await this.runCommand(`rm -rf ${modelsDir}`, 'Removing models...');
        this.log('Ollama models removed', 'success');
      } catch (error) {
        this.log('Failed to remove models directory', 'warn');
      }
    }

    this.state.ollama.installed = false;
    this.state.ollama.configured = false;
    this.saveState();
  }

  private async setupBarkTTS(): Promise<void> {
    this.log('Setting up Bark TTS (Local Text-to-Speech with non-verbal sounds)...', 'info');

    // Check if Python is available
    const hasPython = await this.checkCommand('python3') || await this.checkCommand('python');

    if (!hasPython) {
      this.log('Python is not installed. Bark requires Python 3.8+', 'error');
      this.log('Please install Python first, then run this wizard again.', 'error');
      return;
    }

    // Check if pip is available
    const hasPip = await this.checkCommand('pip3') || await this.checkCommand('pip');

    if (!hasPip) {
      this.log('pip is not installed. Installing...', 'info');
      await this.runCommand('python3 -m ensurepip --upgrade', 'Installing pip...');
    }

    this.log('Installing Bark TTS and dependencies... (this may take a few minutes)', 'info');

    try {
      await this.runCommand(
        'pip3 install --user git+https://github.com/suno-ai/bark.git scipy',
        'Installing Bark...'
      );

      this.log('Downloading Bark models... (this may take a few minutes)', 'info');
      await this.runCommand(
        'python3 -c "from bark import preload_models; preload_models()"',
        'Pre-loading models...'
      );

      this.log('Bark TTS installed successfully', 'success');

      this.envConfig['TTS_ENABLED'] = 'true';
      this.envConfig['TTS_PROVIDER'] = 'bark';
      this.envConfig['BARK_VOICE'] = 'v2/en_speaker_6';
      this.envConfig['BARK_ENABLE_NONVERBAL'] = 'true';
      
      this.state.bark.installed = true;
      this.state.bark.configured = true;
      this.state.bark.lastInstalled = new Date().toISOString();
      this.saveState();
    } catch (error) {
      this.log('Failed to install Bark TTS. You can install it manually later:', 'error');
      this.log('pip3 install git+https://github.com/suno-ai/bark.git scipy', 'info');
    }
  }

  private async uninstallBarkTTS(): Promise<void> {
    this.log('Uninstalling Bark TTS...', 'info');

    try {
      await this.runCommand('pip3 uninstall -y bark scipy', 'Uninstalling Bark...');
      this.log('Bark TTS uninstalled', 'success');
    } catch (error) {
      this.log('Failed to uninstall Bark TTS. You may need to uninstall manually:', 'warn');
      this.log('pip3 uninstall bark scipy', 'info');
    }

    // Ask if user wants to remove models
    const removeModels = await this.confirm('Remove Bark TTS models (~2GB)?');
    if (removeModels) {
      const modelsDir = path.join(homedir(), '.cache', 'suno', 'bark_v0');
      try {
        await this.runCommand(`rm -rf ${modelsDir}`, 'Removing models...');
        this.log('Bark models removed', 'success');
      } catch (error) {
        this.log('Failed to remove models directory', 'warn');
      }
    }

    this.state.bark.installed = false;
    this.state.bark.configured = false;
    this.saveState();
  }

  private async setupUeberzug(): Promise<void> {
    this.log('Setting up Überzug++ (Album Art Display)...', 'info');

    const installed = await this.checkCommand('ueberzug');

    if (installed) {
      this.log('Überzug++ is already installed', 'success');
      return;
    }

    const pm = await this.detectPackageManager();

    if (pm === 'brew') {
      this.log('Überzug++ is not available on macOS. Skipping.', 'warn');
      this.log('Album art will display as ASCII art instead.', 'info');
      return;
    }

    if (pm === 'pacman') {
      const useAUR = await this.confirm('Install Überzug++ from AUR (requires yay or paru)?');
      if (useAUR) {
        const aurHelper = await this.checkCommand('yay') ? 'yay' : await this.checkCommand('paru') ? 'paru' : null;
        if (aurHelper) {
          await this.runCommand(`${aurHelper} -S --noconfirm ueberzug++`, 'Installing Überzug++ from AUR...');
          this.log('Überzug++ installed successfully', 'success');
        } else {
          this.log('No AUR helper found. Please install yay or paru first.', 'warn');
        }
      }
      return;
    }

    this.log('Überzug++ installation requires compilation from source on your system.', 'warn');
    this.log('This is optional - Conductor will use ASCII art for album covers if not installed.', 'info');

    const install = await this.confirm('Install Überzug++ from source? (requires build tools)');

    if (install) {
      try {
        this.log('Installing build dependencies...', 'info');
        if (pm === 'apt') {
          await this.runCommand(
            'sudo apt-get install -y git cmake pkg-config libxcb-util0-dev libxcb-ewmh-dev',
            'Installing dependencies...'
          );
        }

        this.log('Cloning and building Überzug++...', 'info');
        const tmpDir = '/tmp/ueberzugpp-install';
        await this.runCommand(`rm -rf ${tmpDir} && git clone https://github.com/jstkdng/ueberzugpp.git ${tmpDir}`, 'Cloning...');
        await this.runCommand(`cd ${tmpDir} && mkdir -p build && cd build && cmake -DCMAKE_BUILD_TYPE=Release .. && cmake --build .`, 'Building...');
        await this.runCommand(`cd ${tmpDir}/build && sudo cmake --install .`, 'Installing...');
        await this.runCommand(`rm -rf ${tmpDir}`, 'Cleaning up...');

        this.log('Überzug++ installed successfully', 'success');
      } catch (error) {
        this.log('Failed to install Überzug++. You can install it manually later.', 'error');
        this.log('Album art will display as ASCII art instead.', 'info');
      }
    }

    if (install) {
      this.state.ueberzug.installed = true;
      this.state.ueberzug.configured = true;
      this.state.ueberzug.lastInstalled = new Date().toISOString();
      this.saveState();
    }
  }

  private async uninstallUeberzug(): Promise<void> {
    this.log('Uninstalling Überzug++...', 'info');

    const pm = await this.detectPackageManager();

    try {
      if (pm === 'brew') {
        await this.runCommand('brew uninstall ueberzug++', 'Uninstalling Überzug++...');
      } else if (pm === 'pacman') {
        const aurHelper = await this.checkCommand('yay') ? 'yay' : await this.checkCommand('paru') ? 'paru' : null;
        if (aurHelper) {
          await this.runCommand(`${aurHelper} -R --noconfirm ueberzug++`, 'Uninstalling Überzug++...');
        } else {
          await this.runCommand('sudo pacman -R --noconfirm ueberzug++', 'Uninstalling Überzug++...');
        }
      } else if (pm === 'apt') {
        // If installed from source, remove binary
        await this.runCommand('sudo rm -f /usr/local/bin/ueberzug++', 'Removing Überzug++...');
      }
      this.log('Überzug++ uninstalled', 'success');
    } catch (error) {
      this.log('Failed to uninstall Überzug++. You may need to uninstall manually.', 'warn');
    }

    this.state.ueberzug.installed = false;
    this.state.ueberzug.configured = false;
    this.saveState();
  }

  private async setupEnvFile(): Promise<void> {
    this.log('Creating .env configuration file...', 'info');

    const envPath = path.join(process.cwd(), '.env');
    const examplePath = path.join(process.cwd(), '.env.example');

    // Start with example if it exists
    let envContent = '';
    if (existsSync(examplePath)) {
      envContent = readFileSync(examplePath, 'utf-8');
    }

    // Update with configured values
    for (const [key, value] of Object.entries(this.envConfig)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }

    writeFileSync(envPath, envContent);
    this.log(`.env file created at ${envPath}`, 'success');
  }

  async run(): Promise<void> {
    try {
      // Show main menu
      const action = await this.showMainMenu();

      if (action === 'quit') {
        console.clear();
        console.log(ASCII_ART.music);
        console.log(this.colorText('\n👋 Thanks for using Conductor Setup Wizard!', 'cyan'));
        console.log(this.colorText('   Come back anytime to add more features!\n', 'dim'));
        this.rl.close();
        return;
      }

      if (action === 'install') {
        // Select components to install
        const selected = await this.selectComponents('install');

        if (selected.size === 0) {
          await this.run(); // Return to main menu
          return;
        }

        console.clear();
        console.log(this.colorText('\n━━━ 🚀 STARTING INSTALLATION! 🚀 ━━━\n', 'bright'));
        
        await this.showProgressBar([
          'Preparing installation...',
          'Checking system compatibility...',
          'Setting up environment...',
          'Ready to install!',
          'Let\'s go! 🎉'
        ], 400);

        // Install selected components with fun messages
        if (selected.has('mpd')) {
          console.log(this.colorText('\n━━━ 🎵 Installing MPD ━━━', 'cyan'));
          console.log(ASCII_ART.music);
          await this.setupMPD();
        }

        if (selected.has('ollama')) {
          console.log(this.colorText('\n━━━ 🤖 Installing Ollama ━━━', 'cyan'));
          await this.setupOllama();
        }

        if (selected.has('bark')) {
          console.log(this.colorText('\n━━━ 🗣️ Installing Bark TTS ━━━', 'cyan'));
          await this.setupBarkTTS();
        }

        if (selected.has('ueberzug')) {
          console.log(this.colorText('\n━━━ 🖼️ Installing Überzug++ ━━━', 'cyan'));
          await this.setupUeberzug();
        }

        // Create/update .env file
        console.log(this.colorText('\n━━━ ⚙️ Saving Configuration ━━━', 'cyan'));
        await this.showLoadingAnimation('Writing configuration files...', 1500);
        await this.setupEnvFile();

        // Celebration!
        console.clear();
        console.log(this.colorText(ASCII_ART.celebration, 'green'));
        
        this.drawBox('🎉 INSTALLATION COMPLETE! 🎉', [
          this.colorText('Awesome! Your Conductor is ready to rock! 🎸', 'green'),
          '',
          this.colorText('NEXT STEPS:', 'bright'),
          '  1. 📁 Add music files to ~/Music/',
          '  2. 🚀 Run: ' + this.colorText('bun start', 'cyan') + ' (or npm start)',
          '  3. 🎤 Try saying: ' + this.colorText('"play some jazz"', 'magenta'),
          '',
          this.colorText('Enjoy your music! 🎵✨', 'green'),
        ]);
        
        // Ask if user wants to configure more components
        console.log('');
        const configureMore = await this.confirm('Want to add more components?');
        if (configureMore) {
          await this.run(); // Restart wizard
          return;
        } else {
          console.log(this.colorText('\n🎵 Happy listening! See you later! 🎵\n', 'cyan'));
        }
      } else if (action === 'uninstall') {
        // Select components to uninstall
        const selected = await this.selectComponents('uninstall');

        if (selected.size === 0) {
          await this.run(); // Return to main menu
          return;
        }

        console.clear();
        console.log(this.colorText('\n━━━ 🗑️ STARTING UNINSTALL ━━━\n', 'yellow'));

        // Uninstall selected components
        if (selected.has('mpd')) {
          console.log(this.colorText('\n━━━ 🎵 Uninstalling MPD ━━━', 'yellow'));
          await this.uninstallMPD();
        }

        if (selected.has('ollama')) {
          console.log(this.colorText('\n━━━ 🤖 Uninstalling Ollama ━━━', 'yellow'));
          await this.uninstallOllama();
        }

        if (selected.has('bark')) {
          console.log(this.colorText('\n━━━ 🗣️ Uninstalling Bark TTS ━━━', 'yellow'));
          await this.uninstallBarkTTS();
        }

        if (selected.has('ueberzug')) {
          console.log(this.colorText('\n━━━ 🖼️ Uninstalling Überzug++ ━━━', 'yellow'));
          await this.uninstallUeberzug();
        }

        // Done!
        console.log('\n');
        this.drawBox('✓ UNINSTALL COMPLETE', [
          'Components have been successfully removed.',
          '',
          'Your Conductor configuration has been updated.',
        ]);

        // Ask if user wants to do more
        console.log('');
        const doMore = await this.confirm('Return to main menu?');
        if (doMore) {
          await this.run(); // Restart wizard
          return;
        }
      }
    } catch (error) {
      console.log(this.colorText('\n━━━ ⚠️ OOPS! SOMETHING WENT WRONG ━━━\n', 'red'));
      this.log(`Error: ${error}`, 'error');
      console.log('');
      this.drawBox('💡 TROUBLESHOOTING TIPS', [
        '• Check your internet connection',
        '• Make sure you have sufficient permissions',
        '• Try running the wizard again',
        '• Check SETUP.md for manual installation',
      ]);
      console.log('');
      const retry = await this.confirm('Want to try again?');
      if (retry) {
        await this.run();
      }
    } finally {
      this.rl.close();
    }
  }
}

// Run wizard if called directly
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default SetupWizard;
