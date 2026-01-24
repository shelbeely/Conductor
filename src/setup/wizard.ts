#!/usr/bin/env node

/**
 * Interactive Setup Wizard for Conductor
 * Guides users through installing and configuring required dependencies
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import readline from 'readline';

const execAsync = promisify(exec);

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

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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
      info: 'ℹ',
      success: '✓',
      error: '✗',
      warn: '⚠',
    };
    console.log(`${icons[type]} ${message}`);
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
    } catch (error) {
      this.log('Failed to install Bark TTS. You can install it manually later:', 'error');
      this.log('pip3 install git+https://github.com/suno-ai/bark.git scipy', 'info');
    }
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
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        🎵  Conductor Setup Wizard  🎵                    ║');
    console.log('║                                                           ║');
    console.log('║   Interactive installer for beginner-friendly setup      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    try {
      // Step 1: MPD (Required)
      console.log('\n━━━ Step 1: Music Player Daemon (MPD) ━━━');
      console.log('MPD plays your music files and is required for Conductor.');
      await this.setupMPD();

      // Step 2: AI Provider (Required)
      console.log('\n━━━ Step 2: AI Provider ━━━');
      console.log('Choose between local (Ollama) or cloud (OpenRouter/Anthropic) AI.');
      console.log('');

      const aiChoice = await this.question(
        'Install Ollama for local free AI? (y/n - choose n for cloud providers): '
      );

      if (aiChoice.toLowerCase() === 'y' || aiChoice.toLowerCase() === 'yes') {
        await this.setupOllama();
      } else {
        this.log('Skipping Ollama. You can configure cloud AI providers manually in .env', 'info');
        this.log('Options: OpenRouter (openrouter.ai) or Anthropic (console.anthropic.com)', 'info');
      }

      // Step 3: TTS (Optional)
      console.log('\n━━━ Step 3: Text-to-Speech (TTS) - Optional ━━━');
      console.log('Bark TTS enables AI DJ hosts with non-verbal sounds (laughs, sighs, etc.)');
      const ttsChoice = await this.confirm('Install Bark TTS for AI DJ features?');

      if (ttsChoice) {
        await this.setupBarkTTS();
      } else {
        this.log('Skipping Bark TTS. AI DJ features will be disabled.', 'info');
      }

      // Step 4: Überzug++ (Optional)
      console.log('\n━━━ Step 4: Album Art Display - Optional ━━━');
      console.log('Überzug++ shows album covers in the terminal.');
      const artChoice = await this.confirm('Install Überzug++ for album art?');

      if (artChoice) {
        await this.setupUeberzug();
      } else {
        this.log('Skipping Überzug++. Album art will display as ASCII art.', 'info');
      }

      // Step 5: Create .env file
      console.log('\n━━━ Step 5: Configuration File ━━━');
      await this.setupEnvFile();

      // Done!
      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║                                                           ║');
      console.log('║                 ✓  Setup Complete!  ✓                    ║');
      console.log('║                                                           ║');
      console.log('╚═══════════════════════════════════════════════════════════╝\n');

      this.log('Next steps:', 'info');
      console.log('  1. Add music files to ~/Music/');
      console.log('  2. Run: bun start (or npm start)');
      console.log('  3. Try: "play some jazz"');
      console.log('');
      this.log('Enjoy your music! 🎵', 'success');
    } catch (error) {
      this.log(`Setup failed: ${error}`, 'error');
      this.log('You can try running the wizard again or follow the manual setup guide in SETUP.md', 'info');
      process.exit(1);
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
