/**
 * Interactive Setup Wizard for Conductor (React/Ink Component)
 * Guides users through installing and configuring required dependencies
 * Designed to be fun, engaging, and neurodivergent-friendly
 * 
 * Converted from imperative wizard.ts to React/Ink patterns with full
 * performance optimizations following React best practices.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { exec, spawn, type ChildProcess } from 'child_process';
import { promisify } from 'util';
import { existsSync, writeFileSync, readFileSync, mkdirSync, copyFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import { AIAgent, type AIProviderConfig } from '../ai/agent';
import { Assistant, AssistantMessages, getAssistantMessage, type AssistantMode, type AssistantState } from './Assistant';

const execAsync = promisify(exec);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ComponentState {
  installed: boolean;
  configured: boolean;
  lastInstalled?: string;
}

interface AIConfig {
  provider: 'openrouter' | 'anthropic' | 'ollama' | 'copilot';
  apiKey?: string;
  model?: string;
  baseURL?: string;
  configured: boolean;
  tested: boolean;
}

interface SetupState {
  ai: AIConfig;
  mpd: ComponentState;
  ollama: ComponentState;
  bark: ComponentState;
  ueberzug: ComponentState;
}

interface SetupWizardProps {
  onComplete: () => void;
  onExit: () => void;
}

interface ComponentInfo {
  key: 'mpd' | 'ollama' | 'bark' | 'ueberzug';
  name: string;
  emoji: string;
  description: string;
  required: boolean;
}

type ScreenType = 
  | 'loading'
  | 'assistantMode'
  | 'aiWelcome'
  | 'aiProvider'
  | 'aiConfig'
  | 'aiTest'
  | 'aiGuidedMode'
  | 'mainMenu'
  | 'selectInstall'
  | 'selectUninstall'
  | 'installing'
  | 'uninstalling'
  | 'complete'
  | 'error';

type OSType = 'linux' | 'macos' | 'unknown';
type PackageManager = 'apt' | 'pacman' | 'brew' | 'unknown';

interface InstallationProgress {
  component: string;
  stage: string;
  status: 'pending' | 'inProgress' | 'success' | 'error';
  message?: string;
}

// ============================================================================
// ASCII ART AND CONSTANTS (hoisted outside component)
// ============================================================================

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
  conductor: `
     (/¯◡ ‿ ◡)/¯
     
     Your friendly
     orchestra conductor!
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
} as const;

const COMPONENTS_INFO: ComponentInfo[] = [
  {
    key: 'mpd',
    name: 'MPD (Music Player Daemon)',
    emoji: '🎵',
    description: 'Plays your music files',
    required: true,
  },
  {
    key: 'ollama',
    name: 'Ollama (Local AI)',
    emoji: '🤖',
    description: 'Free local AI for natural language control',
    required: false,
  },
  {
    key: 'bark',
    name: 'Bark TTS',
    emoji: '🗣️',
    description: 'AI DJ hosts with non-verbal sounds (laughs, sighs)',
    required: false,
  },
  {
    key: 'ueberzug',
    name: 'Überzug++',
    emoji: '🖼️',
    description: 'Album art display in terminal',
    required: false,
  },
] as const;

const STATE_FILE = path.join(process.cwd(), '.conductor-setup-state.json');

// ============================================================================
// HELPER FUNCTIONS (hoisted outside component)
// ============================================================================

const loadState = (): SetupState => {
  if (existsSync(STATE_FILE)) {
    try {
      const content = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Invalid or corrupted state file, initializing with default state
    }
  }
  return {
    ai: {
      provider: 'openrouter',
      configured: false,
      tested: false,
    },
    mpd: { installed: false, configured: false },
    ollama: { installed: false, configured: false },
    bark: { installed: false, configured: false },
    ueberzug: { installed: false, configured: false },
  };
};

const saveState = (state: SetupState): void => {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
};

const detectOS = async (): Promise<OSType> => {
  try {
    const { stdout } = await execAsync('uname');
    const os = stdout.trim().toLowerCase();
    if (os === 'linux') return 'linux';
    if (os === 'darwin') return 'macos';
  } catch (error) {
    // Command failed, unable to determine OS type
  }
  return 'unknown';
};

const detectPackageManager = async (): Promise<PackageManager> => {
  const managers: Array<{ cmd: string; name: PackageManager }> = [
    { cmd: 'apt-get', name: 'apt' },
    { cmd: 'pacman', name: 'pacman' },
    { cmd: 'brew', name: 'brew' },
  ];

  for (const manager of managers) {
    try {
      await execAsync(`which ${manager.cmd}`);
      return manager.name;
    } catch (error) {
      // Package manager not available on this system
    }
  }
  return 'unknown';
};

const checkCommand = async (command: string): Promise<boolean> => {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch (error) {
    return false;
  }
};

const runCommand = (command: string): Promise<void> => {
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
};

const createMPDConfig = async (os: OSType): Promise<void> => {
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
  }
};

const startMPD = async (os: OSType): Promise<void> => {
  await execAsync('mpd --version'); // Verify MPD works

  if (os === 'linux') {
    // Try to enable and start systemd service
    try {
      await execAsync('systemctl --user enable mpd 2>/dev/null || true');
      await execAsync('systemctl --user start mpd 2>/dev/null || true');
    } catch (error) {
      // Fallback to manual start
      const configFile = path.join(homedir(), '.config', 'mpd', 'mpd.conf');
      await execAsync(`mpd ${configFile} 2>/dev/null || true`);
    }
  } else {
    // macOS or other - start manually
    const configFile = path.join(homedir(), '.config', 'mpd', 'mpd.conf');
    await execAsync(`mpd ${configFile} 2>/dev/null || true`);
  }

  // Update database
  await execAsync('mpc update 2>/dev/null || true');
};

const stopMPD = async (os: OSType): Promise<void> => {
  if (os === 'linux') {
    await execAsync('systemctl --user stop mpd 2>/dev/null || true');
    await execAsync('systemctl --user disable mpd 2>/dev/null || true');
  }
  await execAsync('killall mpd 2>/dev/null || true');
};

const setupEnvFile = (envConfig: Record<string, string>): void => {
  const envPath = path.join(process.cwd(), '.env');
  const examplePath = path.join(process.cwd(), '.env.example');
  const backupPath = path.join(process.cwd(), '.env.backup');

  // Backup existing .env file if it exists
  if (existsSync(envPath)) {
    copyFileSync(envPath, backupPath);
  }

  // Start with example if it exists
  let envContent = '';
  if (existsSync(examplePath)) {
    envContent = readFileSync(examplePath, 'utf-8');
  }

  // Update with configured values
  for (const [key, value] of Object.entries(envConfig)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  writeFileSync(envPath, envContent);
};

const formatComponentStatus = (installed: boolean): string => {
  return installed ? '✓ Installed' : '✗ Not installed';
};

const getAvailableOllamaModels = (): Array<{ key: string; name: string; size: string }> => {
  return [
    { key: '1', name: 'llama3.2', size: '4.7GB - Recommended, good balance' },
    { key: '2', name: 'mistral', size: '4.1GB - Fast and efficient' },
    { key: '3', name: 'qwen2.5:7b', size: '4.7GB - Good for music understanding' },
    { key: '4', name: '', size: 'Skip - I\'ll install a model later' },
  ];
};

// ============================================================================
// SUB-COMPONENTS (with React.memo)
// ============================================================================

interface LoadingAnimationProps {
  message: string;
}

const LoadingAnimation = React.memo(({ message }: LoadingAnimationProps) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % ASCII_ART.loading.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Text color="cyan">
        {ASCII_ART.loading[frame]} {message}
      </Text>
    </Box>
  );
});

LoadingAnimation.displayName = 'LoadingAnimation';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

const ProgressBar = React.memo(({ steps, currentStep }: ProgressBarProps) => {
  const progressIndex = Math.min(currentStep, ASCII_ART.progress.length - 1);
  const displayStep = steps[currentStep] || steps[steps.length - 1];

  return (
    <Box>
      <Text color="green">{ASCII_ART.progress[progressIndex]}</Text>
      <Text> {displayStep}</Text>
    </Box>
  );
});

ProgressBar.displayName = 'ProgressBar';

interface BoxDecoratedProps {
  title: string;
  children: React.ReactNode;
  width?: number;
}

const BoxDecorated = React.memo(({ title, children, width = 60 }: BoxDecoratedProps) => {
  const topBorder = '╔' + '═'.repeat(width - 2) + '╗';
  const bottomBorder = '╚' + '═'.repeat(width - 2) + '╝';
  const emptyLine = '║' + ' '.repeat(width - 2) + '║';
  const titlePadding = Math.floor((width - 2 - title.length) / 2);

  return (
    <Box flexDirection="column">
      <Text color="cyan">{topBorder}</Text>
      <Box>
        <Text color="cyan">║</Text>
        <Text>{' '.repeat(titlePadding)}</Text>
        <Text bold>{title}</Text>
        <Text>{' '.repeat(width - 2 - titlePadding - title.length)}</Text>
        <Text color="cyan">║</Text>
      </Box>
      <Text color="cyan">{emptyLine}</Text>
      {children}
      <Text color="cyan">{emptyLine}</Text>
      <Text color="cyan">{bottomBorder}</Text>
    </Box>
  );
});

BoxDecorated.displayName = 'BoxDecorated';

interface BoxContentLineProps {
  children: React.ReactNode;
  width?: number;
}

const BoxContentLine = React.memo(({ children, width = 60 }: BoxContentLineProps) => {
  return (
    <Box>
      <Text color="cyan">║  </Text>
      <Box width={width - 4}>
        {children}
      </Box>
      <Text color="cyan">║</Text>
    </Box>
  );
});

BoxContentLine.displayName = 'BoxContentLine';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SetupWizard = React.memo(({ onComplete, onExit }: SetupWizardProps) => {
  const { exit } = useApp();

  // State management (lazy initialization)
  const [screen, setScreen] = useState<ScreenType>('loading');
  const [state, setState] = useState<SetupState>(() => loadState());
  const [selectedComponents, setSelectedComponents] = useState<Set<'mpd' | 'ollama' | 'bark' | 'ueberzug'>>(() => new Set());
  const [input, setInput] = useState('');
  const [envConfig, setEnvConfig] = useState<Record<string, string>>(() => ({}));
  const [errorMessage, setErrorMessage] = useState('');
  const [installProgress, setInstallProgress] = useState<InstallationProgress[]>(() => []);
  const [progressStep, setProgressStep] = useState(0);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [awaitingConfirmationType, setAwaitingConfirmationType] = useState<'install' | 'uninstall' | null>(null);
  
  // Assistant state
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('guided');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [assistantMessage, setAssistantMessage] = useState('');
  
  // AI Configuration state
  const [aiProviderSelection, setAiProviderSelection] = useState<'openrouter' | 'anthropic' | 'ollama' | 'copilot'>('openrouter');
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [aiModelInput, setAiModelInput] = useState('');
  const [aiTestingConnection, setAiTestingConnection] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedModeActive, setGuidedModeActive] = useState(false);

  // Derived state (useMemo)
  const availableUninstallComponents = useMemo(() => {
    return COMPONENTS_INFO.filter(comp => state[comp.key].installed);
  }, [state]);

  const hasUninstallableComponents = availableUninstallComponents.length > 0;

  const selectedComponentsList = useMemo(() => {
    return COMPONENTS_INFO.filter(comp => selectedComponents.has(comp.key));
  }, [selectedComponents]);

  // Constants for this component
  const availableInstallComponents = COMPONENTS_INFO;

  // Effect: Initial loading screen
  useEffect(() => {
    if (screen === 'loading') {
      const timer = setTimeout(() => {
        // Start with assistant mode selection
        setScreen('assistantMode');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Effect: Progress bar animation during installation
  useEffect(() => {
    if (screen === 'installing' && progressStep < 4) {
      const timer = setTimeout(() => {
        setProgressStep(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [screen, progressStep]);

  // Effect: Save state to file when it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Event handlers (useCallback)
  
  // AI Configuration Handlers
  const handleAssistantModeInput = useCallback((char: string) => {
    if (screen !== 'assistantMode') return;
    
    if (char === '1') {
      setAssistantMode('guided');
      setAssistantState('idle');
      setAssistantMessage(getAssistantMessage('guided', 'welcome'));
      // Check if AI is configured - if not, start with AI setup
      if (!state.ai.configured) {
        setScreen('aiWelcome');
      } else {
        setScreen('mainMenu');
      }
    } else if (char === '2') {
      setAssistantMode('fast');
      setAssistantState('idle');
      setAssistantMessage(getAssistantMessage('fast', 'welcome'));
      if (!state.ai.configured) {
        setScreen('aiWelcome');
      } else {
        setScreen('mainMenu');
      }
    } else if (char === '3') {
      setAssistantMode('silent');
      setAssistantState('idle');
      setAssistantMessage('');
      if (!state.ai.configured) {
        setScreen('aiWelcome');
      } else {
        setScreen('mainMenu');
      }
    }
  }, [screen, state.ai.configured]);

  const handleAIWelcomeInput = useCallback((char: string) => {
    if (screen !== 'aiWelcome') return;
    if (char.toLowerCase() === 'y' || char === ' ' || char === '\r') {
      setAssistantState('idle');
      setAssistantMessage(getAssistantMessage(assistantMode, 'aiSetup'));
      setScreen('aiProvider');
    }
  }, [screen, assistantMode]);

  const handleAIProviderInput = useCallback((char: string) => {
    if (screen !== 'aiProvider') return;
    
    if (char === '1') {
      setAiProviderSelection('openrouter');
      setScreen('aiConfig');
    } else if (char === '2') {
      setAiProviderSelection('anthropic');
      setScreen('aiConfig');
    } else if (char === '3') {
      setAiProviderSelection('ollama');
      setScreen('aiConfig');
    } else if (char === '4') {
      setAiProviderSelection('copilot');
      setScreen('aiConfig');
    }
  }, [screen]);

  const handleAIConfigInput = useCallback((char: string, key: any) => {
    if (screen !== 'aiConfig') return;
    
    if (key.return) {
      // Test the connection
      setScreen('aiTest');
    } else if (key.backspace || key.delete) {
      setAiApiKeyInput(prev => prev.slice(0, -1));
    } else if (!key.ctrl && !key.meta && char) {
      setAiApiKeyInput(prev => prev + char);
    }
  }, [screen]);

  const testAIConnection = useCallback(async () => {
    setAiTestingConnection(true);
    setAiTestResult(null);
    
    try {
      const config: AIProviderConfig = {
        provider: aiProviderSelection,
        apiKey: aiApiKeyInput || undefined,
        baseURL: aiProviderSelection === 'ollama' ? 'http://localhost:11434' : undefined,
      };
      
      const agent = new AIAgent(config);
      
      // Simple test command
      const response = await agent.processCommand('Say "Connection successful!" if you can read this.');
      
      if (response && response.message) {
        setAiTestResult({ success: true, message: 'Connection successful!' });
        
        // Update state with AI config
        setState((prev: SetupState) => ({
          ...prev,
          ai: {
            provider: aiProviderSelection,
            apiKey: aiApiKeyInput || undefined,
            configured: true,
            tested: true,
          }
        }));
        
        // Update env config
        setEnvConfig(prev => ({
          ...prev,
          AI_PROVIDER: aiProviderSelection,
          ...(aiApiKeyInput && aiProviderSelection === 'openrouter' ? { OPENROUTER_API_KEY: aiApiKeyInput } : {}),
          ...(aiApiKeyInput && aiProviderSelection === 'anthropic' ? { ANTHROPIC_API_KEY: aiApiKeyInput } : {}),
          ...(aiApiKeyInput && aiProviderSelection === 'copilot' ? { GITHUB_TOKEN: aiApiKeyInput } : {}),
        }));
        
        // After 2 seconds, offer guided mode
        setTimeout(() => {
          setScreen('aiGuidedMode');
        }, 2000);
      } else {
        setAiTestResult({ success: false, message: 'No response from AI. Please check your configuration.' });
      }
    } catch (error) {
      setAiTestResult({ 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setAiTestingConnection(false);
    }
  }, [aiProviderSelection, aiApiKeyInput]);

  useEffect(() => {
    if (screen === 'aiTest' && !aiTestingConnection && !aiTestResult) {
      testAIConnection();
    }
  }, [screen, aiTestingConnection, aiTestResult, testAIConnection]);

  const handleAITestInput = useCallback((char: string) => {
    if (screen !== 'aiTest') return;
    
    if (aiTestResult) {
      if (aiTestResult.success) {
        // Success - move to guided mode offer
        setScreen('aiGuidedMode');
      } else {
        // Failed - go back to config
        if (char.toLowerCase() === 'r') {
          setAiTestResult(null);
          setScreen('aiConfig');
        } else if (char.toLowerCase() === 'q') {
          onExit();
          exit();
        }
      }
    }
  }, [screen, aiTestResult, onExit, exit]);

  const handleAIGuidedModeInput = useCallback((char: string) => {
    if (screen !== 'aiGuidedMode') return;
    
    if (char.toLowerCase() === 'y') {
      setGuidedMode(true);
      setGuidedModeActive(true);
      setAssistantMessage('Great! I\'m here to help. Let me guide you through the setup process...');
      setScreen('mainMenu');
    } else if (char.toLowerCase() === 'n') {
      setGuidedMode(false);
      setGuidedModeActive(false);
      setScreen('mainMenu');
    }
  }, [screen]);

  const handleMainMenuInput = useCallback((char: string) => {
    if (screen !== 'mainMenu') return;

    if (char.toLowerCase() === 'q') {
      onExit();
      exit();
    } else if (char === '1') {
      setScreen('selectInstall');
      setInput('');
    } else if (char === '2') {
      if (hasUninstallableComponents) {
        setScreen('selectUninstall');
        setInput('');
      } else {
        // No components to uninstall, show message and return
        setScreen('mainMenu');
      }
    }
  }, [screen, hasUninstallableComponents, onExit, exit]);

  const handleSelectInstallInput = useCallback((char: string, key: any) => {
    if (screen !== 'selectInstall') return;

    if (char.toLowerCase() === 'q') {
      setScreen('mainMenu');
      setInput('');
      setSelectedComponents(new Set());
      return;
    }

    if (key.return) {
      const trimmedInput = input.trim().toLowerCase();
      
      if (trimmedInput === 'a') {
        // Select all components
        const allKeys = new Set(COMPONENTS_INFO.map(c => c.key));
        setSelectedComponents(allKeys);
        setConfirmingAction(true);
        setAwaitingConfirmationType('install');
        setInput('');
      } else {
        // Parse numbers
        const numbers = input.split(/[\s,]+/).map(n => parseInt(n.trim()));
        const newSelected = new Set<keyof SetupState>();
        
        // Always include MPD
        newSelected.add('mpd');
        
        numbers.forEach(num => {
          if (num >= 1 && num <= availableInstallComponents.length) {
            newSelected.add(availableInstallComponents[num - 1].key);
          }
        });

        if (newSelected.size > 0) {
          setSelectedComponents(newSelected);
          setConfirmingAction(true);
          setAwaitingConfirmationType('install');
          setInput('');
        }
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (char) {
      setInput(prev => prev + char);
    }
  }, [screen, input, availableInstallComponents]);

  const handleSelectUninstallInput = useCallback((char: string, key: any) => {
    if (screen !== 'selectUninstall') return;

    if (char.toLowerCase() === 'q') {
      setScreen('mainMenu');
      setInput('');
      setSelectedComponents(new Set());
      return;
    }

    if (key.return) {
      const trimmedInput = input.trim().toLowerCase();
      
      if (trimmedInput === 'a') {
        // Select all installed components
        const allKeys = new Set(availableUninstallComponents.map(c => c.key));
        setSelectedComponents(allKeys);
        setConfirmingAction(true);
        setAwaitingConfirmationType('uninstall');
        setInput('');
      } else {
        // Parse numbers
        const numbers = input.split(/[\s,]+/).map(n => parseInt(n.trim()));
        const newSelected = new Set<keyof SetupState>();
        
        numbers.forEach(num => {
          if (num >= 1 && num <= availableUninstallComponents.length) {
            newSelected.add(availableUninstallComponents[num - 1].key);
          }
        });

        if (newSelected.size > 0) {
          setSelectedComponents(newSelected);
          setConfirmingAction(true);
          setAwaitingConfirmationType('uninstall');
          setInput('');
        }
      }
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (char) {
      setInput(prev => prev + char);
    }
  }, [screen, input, availableUninstallComponents]);

  const handleConfirmationInput = useCallback((char: string) => {
    if (!confirmingAction) return;

    const answer = char.toLowerCase();
    
    if (answer === 'y') {
      setConfirmingAction(false);
      
      if (awaitingConfirmationType === 'install') {
        setScreen('installing');
        setProgressStep(0);
        // Start installation process (async but fire-and-forget with internal error handling)
        performInstallation().catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
          setScreen('error');
        });
      } else if (awaitingConfirmationType === 'uninstall') {
        setScreen('uninstalling');
        // Start uninstallation process (async but fire-and-forget with internal error handling)
        performUninstallation().catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
          setScreen('error');
        });
      }
      
      setAwaitingConfirmationType(null);
    } else if (answer === 'n') {
      const previousType = awaitingConfirmationType;
      
      setConfirmingAction(false);
      setAwaitingConfirmationType(null);
      setSelectedComponents(new Set());
      
      // Return to selection screen based on previous type
      if (previousType === 'install') {
        setScreen('selectInstall');
      } else if (previousType === 'uninstall') {
        setScreen('selectUninstall');
      } else {
        setScreen('mainMenu');
      }
    }
  }, [confirmingAction, awaitingConfirmationType]);

  const handleCompleteInput = useCallback((char: string) => {
    if (screen !== 'complete') return;

    const answer = char.toLowerCase();
    
    if (answer === 'y') {
      setScreen('mainMenu');
      setSelectedComponents(new Set());
      setInput('');
    } else if (answer === 'n') {
      onComplete();
      exit();
    }
  }, [screen, onComplete, exit]);

  const handleErrorInput = useCallback((char: string) => {
    if (screen !== 'error') return;

    const answer = char.toLowerCase();
    
    if (answer === 'y') {
      setScreen('mainMenu');
      setErrorMessage('');
      setSelectedComponents(new Set());
    } else if (answer === 'n') {
      onExit();
      exit();
    }
  }, [screen, onExit, exit]);

  // Installation logic
  const performInstallation = useCallback(async () => {
    try {
      const newEnvConfig: Record<string, string> = {};

      // Install MPD
      if (selectedComponents.has('mpd')) {
        // Show assistant message before installation
        setAssistantState('idle');
        setAssistantMessage(getAssistantMessage(assistantMode, 'beforeMPDInstall'));
        
        setInstallProgress(prev => [...prev, { 
          component: 'mpd', 
          stage: 'checking', 
          status: 'inProgress' 
        }]);

        const mpdInstalled = await checkCommand('mpd');
        const mpcInstalled = await checkCommand('mpc');

        if (!mpdInstalled || !mpcInstalled) {
          const pm = await detectPackageManager();
          
          setInstallProgress(prev => [...prev, { 
            component: 'mpd', 
            stage: 'installing', 
            status: 'inProgress' 
          }]);
          
          setAssistantState('thinking');
          setAssistantMessage('Running package manager to install MPD...');

          if (pm === 'apt') {
            await runCommand('sudo apt-get update && sudo apt-get install -y mpd mpc');
          } else if (pm === 'pacman') {
            await runCommand('sudo pacman -S --noconfirm mpd mpc');
          } else if (pm === 'brew') {
            await runCommand('brew install mpd mpc');
          } else {
            throw new Error('Could not detect package manager');
          }
        }

        // Configure MPD
        const os = await detectOS();
        await createMPDConfig(os);
        await startMPD(os);

        newEnvConfig['MPD_HOST'] = 'localhost';
        newEnvConfig['MPD_PORT'] = '6600';

        setState((prev: SetupState) => ({
          ...prev,
          mpd: { installed: true, configured: true, lastInstalled: new Date().toISOString() }
        }));

        setInstallProgress(prev => [...prev, { 
          component: 'mpd', 
          stage: 'complete', 
          status: 'success' 
        }]);
        
        setAssistantState('success');
        setAssistantMessage(AssistantMessages.success.component);
      }

      // Install Ollama
      if (selectedComponents.has('ollama')) {
        setInstallProgress(prev => [...prev, { 
          component: 'ollama', 
          stage: 'checking', 
          status: 'inProgress' 
        }]);

        const installed = await checkCommand('ollama');

        if (!installed) {
          setInstallProgress(prev => [...prev, { 
            component: 'ollama', 
            stage: 'installing', 
            status: 'inProgress',
            message: 'Please install Ollama manually'
          }]);

          // Note: For security, we don't execute remote scripts automatically
          // Users should install Ollama from the official website or package manager
          const os = await detectOS();
          const pm = await detectPackageManager();
          let installInstructions = 'Visit https://ollama.ai/download';
          
          if (os === 'macos' && pm === 'brew') {
            installInstructions = 'Run: brew install ollama';
          } else if (os === 'linux') {
            installInstructions = 'Visit https://ollama.ai/download or use your package manager';
          }
          
          throw new Error(`Ollama must be installed manually. ${installInstructions}`);
        }

        // Start Ollama service
        try {
          await execAsync('curl -s http://localhost:11434/api/tags');
        } catch (error) {
          spawn('ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
          }).unref();

          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Note: Model selection would need additional UI state handling
        // For now, just mark as installed
        newEnvConfig['AI_PROVIDER'] = 'ollama';
        newEnvConfig['OLLAMA_BASE_URL'] = 'http://localhost:11434';
        newEnvConfig['AI_MODEL'] = 'llama3.2';

        setState(prev => ({
          ...prev,
          ollama: { installed: true, configured: true, lastInstalled: new Date().toISOString() }
        }));

        setInstallProgress(prev => [...prev, { 
          component: 'ollama', 
          stage: 'complete', 
          status: 'success' 
        }]);
      }

      // Install Bark
      if (selectedComponents.has('bark')) {
        setInstallProgress(prev => [...prev, { 
          component: 'bark', 
          stage: 'checking', 
          status: 'inProgress' 
        }]);

        const hasPython = await checkCommand('python3') || await checkCommand('python');

        if (!hasPython) {
          throw new Error('Python is not installed. Bark requires Python 3.8+');
        }

        setInstallProgress(prev => [...prev, { 
          component: 'bark', 
          stage: 'installing', 
          status: 'inProgress' 
        }]);

        // Install Bark with scipy (scipy is a common dependency, likely already installed)
        // Security: Using specific commit hash to avoid pulling unstable code from @main
        // Latest stable as of 2024-01: commit 89e8b91
        await runCommand('pip3 install --user "git+https://github.com/suno-ai/bark.git@89e8b91" scipy');
        await runCommand('python3 -c "from bark import preload_models; preload_models()"');

        newEnvConfig['TTS_ENABLED'] = 'true';
        newEnvConfig['TTS_PROVIDER'] = 'bark';
        newEnvConfig['BARK_VOICE'] = 'v2/en_speaker_6';
        newEnvConfig['BARK_ENABLE_NONVERBAL'] = 'true';

        setState(prev => ({
          ...prev,
          bark: { installed: true, configured: true, lastInstalled: new Date().toISOString() }
        }));

        setInstallProgress(prev => [...prev, { 
          component: 'bark', 
          stage: 'complete', 
          status: 'success' 
        }]);
      }

      // Install Überzug++
      if (selectedComponents.has('ueberzug')) {
        setInstallProgress(prev => [...prev, { 
          component: 'ueberzug', 
          stage: 'checking', 
          status: 'inProgress' 
        }]);

        const installed = await checkCommand('ueberzug');

        if (!installed) {
          const pm = await detectPackageManager();

          if (pm === 'brew') {
            // macOS - Überzug++ not supported
            setInstallProgress(prev => [...prev, { 
              component: 'ueberzug', 
              stage: 'skipped', 
              status: 'success',
              message: 'Not available on macOS' 
            }]);
            
            // Don't mark as installed on macOS
            setState(prev => ({
              ...prev,
              ueberzug: { installed: false, configured: false }
            }));
          } else if (pm === 'pacman') {
            const aurHelper = await checkCommand('yay') ? 'yay' : await checkCommand('paru') ? 'paru' : null;
            if (aurHelper) {
              await runCommand(`${aurHelper} -S --noconfirm ueberzug++`);
              
              setState(prev => ({
                ...prev,
                ueberzug: { installed: true, configured: true, lastInstalled: new Date().toISOString() }
              }));
            } else {
              // No AUR helper, mark as not installed
              setInstallProgress(prev => [...prev, { 
                component: 'ueberzug', 
                stage: 'skipped', 
                status: 'success',
                message: 'Requires AUR helper (yay/paru)' 
              }]);
              
              setState(prev => ({
                ...prev,
                ueberzug: { installed: false, configured: false }
              }));
            }
          } else {
            // Other distros - requires manual installation
            setInstallProgress(prev => [...prev, { 
              component: 'ueberzug', 
              stage: 'skipped', 
              status: 'success',
              message: 'Requires manual installation' 
            }]);
            
            setState(prev => ({
              ...prev,
              ueberzug: { installed: false, configured: false }
            }));
          }
        } else {
          // Already installed
          setState(prev => ({
            ...prev,
            ueberzug: { installed: true, configured: true }
          }));
        }

        setInstallProgress(prev => [...prev, { 
          component: 'ueberzug', 
          stage: 'complete', 
          status: 'success' 
        }]);
      }

      // Save .env configuration
      setAssistantState('idle');
      setAssistantMessage(getAssistantMessage(assistantMode, 'beforeEnvWrite'));
      setEnvConfig(newEnvConfig);
      setupEnvFile(newEnvConfig);

      // Show completion screen
      setAssistantState('success');
      setAssistantMessage(AssistantMessages.success.complete);
      setScreen('complete');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setAssistantState('error');
      setAssistantMessage(AssistantMessages.error.generic);
      setScreen('error');
    }
  }, [selectedComponents, assistantMode]);

  // Uninstallation logic
  const performUninstallation = useCallback(async () => {
    try {
      const os = await detectOS();
      const pm = await detectPackageManager();

      // Uninstall MPD
      if (selectedComponents.has('mpd')) {
        await stopMPD(os);

        if (pm === 'apt') {
          await runCommand('sudo apt-get remove -y mpd mpc');
        } else if (pm === 'pacman') {
          await runCommand('sudo pacman -R --noconfirm mpd mpc');
        } else if (pm === 'brew') {
          await runCommand('brew uninstall mpd mpc');
        }

        setState((prev: SetupState) => ({
          ...prev,
          mpd: { installed: false, configured: false }
        }));
      }

      // Uninstall Ollama
      if (selectedComponents.has('ollama')) {
        await execAsync('killall ollama 2>/dev/null || true');

        if (os === 'linux') {
          await runCommand('sudo rm -f /usr/local/bin/ollama /usr/bin/ollama');
          await runCommand('sudo rm -rf /usr/share/ollama');
        } else if (os === 'macos' && pm === 'brew') {
          await runCommand('brew uninstall ollama');
        }

        setState((prev: SetupState) => ({
          ...prev,
          ollama: { installed: false, configured: false }
        }));
      }

      // Uninstall Bark
      if (selectedComponents.has('bark')) {
        // Note: pip installs from git URLs typically use the repo name as package name
        // Try common package name variants
        const packageNames = ['bark', 'suno-bark'];
        for (const pkgName of packageNames) {
          try {
            await runCommand(`pip3 uninstall -y ${pkgName}`);
            break; // Success, no need to try other names
          } catch (error) {
            // Package name not found or uninstall failed, trying next variant
          }
        }

        setState((prev: SetupState) => ({
          ...prev,
          bark: { installed: false, configured: false }
        }));
      }

      // Uninstall Überzug++
      if (selectedComponents.has('ueberzug')) {
        try {
          if (pm === 'pacman') {
            const aurHelper = await checkCommand('yay') ? 'yay' : await checkCommand('paru') ? 'paru' : null;
            if (aurHelper) {
              await runCommand(`${aurHelper} -R --noconfirm ueberzug++`);
            } else {
              await runCommand('sudo pacman -R --noconfirm ueberzug++');
            }
          } else if (pm === 'apt') {
            // If installed from source, remove binary
            await runCommand('sudo rm -f /usr/local/bin/ueberzug++');
          }
          // Note: Skipping brew case since Überzug++ is not supported on macOS
        } catch (error) {
          // Ignore uninstall errors - component may not be properly installed or already removed
        }

        setState((prev: SetupState) => ({
          ...prev,
          ueberzug: { installed: false, configured: false }
        }));
      }

      setScreen('complete');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setScreen('error');
    }
  }, [selectedComponents]);

  // Input handling
  useInput((char: string, key: any) => {
    if (confirmingAction) {
      handleConfirmationInput(char);
    } else if (screen === 'assistantMode') {
      handleAssistantModeInput(char);
    } else if (screen === 'aiWelcome') {
      handleAIWelcomeInput(char);
    } else if (screen === 'aiProvider') {
      handleAIProviderInput(char);
    } else if (screen === 'aiConfig') {
      handleAIConfigInput(char, key);
    } else if (screen === 'aiTest') {
      handleAITestInput(char);
    } else if (screen === 'aiGuidedMode') {
      handleAIGuidedModeInput(char);
    } else if (screen === 'mainMenu') {
      handleMainMenuInput(char);
    } else if (screen === 'selectInstall') {
      handleSelectInstallInput(char, key);
    } else if (screen === 'selectUninstall') {
      handleSelectUninstallInput(char, key);
    } else if (screen === 'complete') {
      handleCompleteInput(char);
    } else if (screen === 'error') {
      handleErrorInput(char);
    }
  });

  // ============================================================================
  // SCREEN RENDERERS
  // ============================================================================

  if (screen === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">{ASCII_ART.logo}</Text>
        <Box marginTop={1}>
          <LoadingAnimation message="Starting setup wizard..." />
        </Box>
      </Box>
    );
  }

  if (screen === 'assistantMode') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">{ASCII_ART.logo}</Text>
        
        <Box marginTop={1}>
          <Text>{ASCII_ART.conductor}</Text>
        </Box>

        <BoxDecorated title="🤖 SETUP ASSISTANT MODE 🤖">
          <BoxContentLine>
            <Text bold color="green">Welcome to Conductor!</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>Choose how much help you'd like during setup:</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="cyan" bold>1. Guided</Text> <Text>(Recommended for first-time users)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   I'll explain each step and offer suggestions</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   Perfect if you want to learn as you go!</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="yellow" bold>2. Fast</Text> <Text>(For experienced users)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   I'll stay out of your way, only warning about important stuff</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   Get through setup quickly!</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="gray" bold>3. Silent</Text> <Text>(Expert mode)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   I'll only appear for errors and required confirmations</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>   Maximum speed, minimum assistance</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="magenta" dimColor>💡 You can always change this later!</Text>
          </BoxContentLine>
        </BoxDecorated>

        <Box marginTop={1}>
          <Text color="cyan">Select mode (1, 2, or 3): </Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'aiWelcome') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">{ASCII_ART.logo}</Text>
        
        <Box marginTop={1}>
          <Text>{ASCII_ART.conductor}</Text>
        </Box>

        {assistantMessage && (
          <Box marginTop={1}>
            <Assistant mode={assistantMode} state={assistantState} message={assistantMessage} />
          </Box>
        )}

        <BoxDecorated title="🤖 AI-POWERED SETUP ASSISTANT 🤖">
          <BoxContentLine>
            <Text bold color="green">Let's configure your AI!</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>Before we begin, let's set up your AI assistant.</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>This will power:</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  {ASCII_ART.star} Natural language music control</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  {ASCII_ART.star} AI DJ hosts with commentary</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  {ASCII_ART.star} Intelligent playlist generation</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  {ASCII_ART.star} Optional: Guided setup assistance</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="magenta">✨ Let's get started! ✨</Text>
          </BoxContentLine>
        </BoxDecorated>

        <Box marginTop={1}>
          <Text color="cyan">Press any key to continue...</Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'aiProvider') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>━━━ 🤖 SELECT AI PROVIDER ━━━</Text>
        
        {assistantMessage && (
          <Box marginTop={1}>
            <Assistant mode={assistantMode} state={assistantState} message={assistantMessage} />
          </Box>
        )}
        
        <Box marginTop={1} flexDirection="column">
          <Text></Text>
          <Text>Choose your AI provider:</Text>
          <Text></Text>
          
          <Text>  <Text color={aiProviderSelection === 'openrouter' ? 'green' : 'white'} bold={aiProviderSelection === 'openrouter'}>1</Text>. <Text color="green">OpenRouter</Text> (Recommended) - Access to multiple AI models</Text>
          <Text>     Remote, requires API key (~$0.001-0.01 per request)</Text>
          <Text></Text>
          
          <Text>  <Text color={aiProviderSelection === 'anthropic' ? 'green' : 'white'} bold={aiProviderSelection === 'anthropic'}>2</Text>. Anthropic Claude - Direct access to Claude models</Text>
          <Text>     Remote, requires API key (~$0.003-0.015 per request)</Text>
          <Text></Text>
          
          <Text>  <Text color={aiProviderSelection === 'ollama' ? 'green' : 'white'} bold={aiProviderSelection === 'ollama'}>3</Text>. Ollama - Free local AI (install separately)</Text>
          <Text>     Local, no API key needed, requires installation</Text>
          <Text></Text>
          
          <Text>  <Text color={aiProviderSelection === 'copilot' ? 'green' : 'white'} bold={aiProviderSelection === 'copilot'}>4</Text>. GitHub Copilot - Use your Copilot subscription</Text>
          <Text>     Remote, requires GitHub token with Copilot access</Text>
          <Text></Text>
          
          <Text color="yellow">💡 Tip: OpenRouter is recommended for best results and flexibility!</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="cyan">Select option (1-4): </Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'aiConfig') {
    const needsApiKey = aiProviderSelection !== 'ollama';
    
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>━━━ 🔑 CONFIGURE {aiProviderSelection.toUpperCase()} ━━━</Text>
        
        <Box marginTop={1} flexDirection="column">
          <Text></Text>
          
          {aiProviderSelection === 'openrouter' && (
            <>
              <Text>To use OpenRouter:</Text>
              <Text>  1. Visit <Text color="cyan" underline>https://openrouter.ai/</Text></Text>
              <Text>  2. Sign up for a free account</Text>
              <Text>  3. Add some credits (starts at $5)</Text>
              <Text>  4. Get your API key from Settings</Text>
              <Text></Text>
              <Text color="green">✨ Recommended models: Claude 3.5 Sonnet, GPT-4o</Text>
            </>
          )}
          
          {aiProviderSelection === 'anthropic' && (
            <>
              <Text>To use Anthropic Claude:</Text>
              <Text>  1. Visit <Text color="cyan" underline>https://console.anthropic.com/</Text></Text>
              <Text>  2. Sign up for an account</Text>
              <Text>  3. Add credits to your account</Text>
              <Text>  4. Create an API key</Text>
            </>
          )}
          
          {aiProviderSelection === 'ollama' && (
            <>
              <Text color="green">Ollama runs locally - no API key needed!</Text>
              <Text></Text>
              <Text>You can install it later in the wizard.</Text>
              <Text>Press Enter to continue...</Text>
            </>
          )}
          
          {aiProviderSelection === 'copilot' && (
            <>
              <Text>To use GitHub Copilot:</Text>
              <Text>  1. Have an active GitHub Copilot subscription</Text>
              <Text>  2. Visit <Text color="cyan" underline>https://github.com/settings/tokens</Text></Text>
              <Text>  3. Create a token with 'copilot' scope</Text>
            </>
          )}
          
          {needsApiKey && (
            <>
              <Text></Text>
              <Text></Text>
              <Text>Enter your API key:</Text>
              <Box>
                <Text color="green">🔑 </Text>
                <Text>{aiApiKeyInput.split('').map((_, i) => i < aiApiKeyInput.length - 4 ? '*' : aiApiKeyInput[i]).join('')}</Text>
                <Text>_</Text>
              </Box>
              <Text></Text>
              <Text color="gray" dimColor>(Your key will be stored securely in .env)</Text>
            </>
          )}
        </Box>

        <Box marginTop={1}>
          <Text color="cyan">{needsApiKey ? 'Press Enter when ready to test connection...' : 'Press Enter to continue...'}</Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'aiTest') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>━━━ 🧪 TESTING CONNECTION ━━━</Text>
        
        <Box marginTop={1} flexDirection="column">
          <Text></Text>
          
          {aiTestingConnection && (
            <>
              <LoadingAnimation message={`Testing connection to ${aiProviderSelection}...`} />
              <Text></Text>
              <Text color="gray" dimColor>This may take a few seconds...</Text>
            </>
          )}
          
          {aiTestResult && (
            <>
              {aiTestResult.success ? (
                <>
                  <Text color="green" bold>✓ Success!</Text>
                  <Text></Text>
                  <Text>{aiTestResult.message}</Text>
                  <Text></Text>
                  <Text color="green">Your AI is ready to help you! 🎉</Text>
                  <Text></Text>
                  <Text color="cyan">Press any key to continue...</Text>
                </>
              ) : (
                <>
                  <Text color="red" bold>✗ Connection Failed</Text>
                  <Text></Text>
                  <Text color="red">{aiTestResult.message}</Text>
                  <Text></Text>
                  <Text>Possible issues:</Text>
                  <Text>  • Check your API key</Text>
                  <Text>  • Verify your account has credits</Text>
                  <Text>  • Check your internet connection</Text>
                  {aiProviderSelection === 'ollama' && (
                    <Text>  • Make sure Ollama is running: ollama serve</Text>
                  )}
                  <Text></Text>
                  <Text color="yellow">Press R to retry configuration | Q to quit</Text>
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }

  if (screen === 'aiGuidedMode') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">{ASCII_ART.logo}</Text>
        
        <Box marginTop={1}>
          <Text>{ASCII_ART.conductor}</Text>
        </Box>

        <BoxDecorated title="🎓 GUIDED SETUP MODE 🎓">
          <BoxContentLine>
            <Text bold color="magenta">Your AI is now configured!</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>Would you like me to guide you through the rest</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>of the setup with helpful tips and explanations?</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="green">✓ I'll explain each step</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="green">✓ Suggest recommended options</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="green">✓ Answer questions along the way</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="cyan">You can always disable this later!</Text>
          </BoxContentLine>
        </BoxDecorated>

        <Box marginTop={1}>
          <Text color="green">Enable guided mode? (Y/n): </Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'mainMenu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">{ASCII_ART.logo}</Text>
        
        <Box marginTop={1}>
          <Text>{ASCII_ART.conductor}</Text>
        </Box>

        {guidedModeActive && assistantMessage && (
          <Box marginTop={1} padding={1} borderStyle="round" borderColor="magenta">
            <Text color="magenta">🤖 Assistant: {assistantMessage}</Text>
          </Box>
        )}

        <BoxDecorated title="🎵 WELCOME TO CONDUCTOR SETUP! 🎵">
          <BoxContentLine>
            <Text>I'm your friendly setup assistant!</Text>
          </BoxContentLine>
          {state.ai.configured && (
            <BoxContentLine>
              <Text color="green">✓ AI configured: {state.ai.provider} {guidedModeActive && '(Guided mode ON)'}</Text>
            </BoxContentLine>
          )}
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>This wizard will help you:</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>{ASCII_ART.star} Install music player (MPD)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>{ASCII_ART.star} Set up local AI (Ollama - optional)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>{ASCII_ART.star} Add DJ voices (Bark TTS)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>{ASCII_ART.star} Enable album art (Überzug++)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="magenta">✨ Designed to be neurodivergent-friendly! ✨</Text>
          </BoxContentLine>
        </BoxDecorated>

        <Box marginTop={1} flexDirection="column">
          <Text bold>━━━ MAIN MENU ━━━</Text>
          <Text></Text>
          <Text>  <Text color="green">1</Text>. {ASCII_ART.checkmark} Install/Configure components</Text>
          <Text>  <Text color="red">2</Text>. {ASCII_ART.crossmark} Uninstall components</Text>
          <Text>  <Text color="yellow">Q</Text>. Exit wizard</Text>
          <Text></Text>
          <Text color="cyan">Choose an option (1, 2, or Q):</Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'selectInstall') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>━━━ 📦 COMPONENT SELECTION (INSTALL) 📦 ━━━</Text>
        <Text></Text>

        <BoxDecorated title="Select components to install:">
          {availableInstallComponents.map((comp: ComponentInfo, idx: number) => {
            const statusText = formatComponentStatus(state[comp.key].installed);
            const requiredLabel = comp.required ? '(Required)' : '(Optional)';
            
            return (
              <React.Fragment key={comp.key}>
                <BoxContentLine>
                  <Text>
                    <Text color="cyan">{idx + 1}</Text>. {comp.emoji} {comp.name} {' '}
                    <Text color={comp.required ? 'yellow' : 'gray'}>
                      {requiredLabel}
                    </Text>
                  </Text>
                </BoxContentLine>
                <BoxContentLine>
                  <Text>
                    {'   '}[<Text color={state[comp.key].installed ? 'green' : 'gray'}>
                      {statusText}
                    </Text>] {comp.description}
                  </Text>
                </BoxContentLine>
              </React.Fragment>
            );
          })}
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text><Text color="green">A</Text>. ✨ Install ALL optional components</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text><Text color="yellow">Q</Text>. ← Go back to main menu</Text>
          </BoxContentLine>
        </BoxDecorated>

        {confirmingAction && awaitingConfirmationType === 'install' && (
          <Box marginTop={1} flexDirection="column">
            <Text bold>━━━ YOUR SELECTION ━━━</Text>
            <Text></Text>
            {selectedComponentsList.map((comp: ComponentInfo) => (
              <Text key={comp.key}>
                  <Text color="green">✓</Text> {comp.emoji} {comp.name}
              </Text>
            ))}
            <Text></Text>
            <Text color="green">🚀 Ready to install? (y/n):</Text>
          </Box>
        )}

        {!confirmingAction && (
          <Box marginTop={1}>
            <Text color="cyan">
              Enter numbers (e.g., "1 2 4") or "A" for all, "Q" to go back: {input}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (screen === 'selectUninstall') {
    if (!hasUninstallableComponents) {
      return (
        <Box flexDirection="column" padding={1}>
          <BoxDecorated title="ℹ️ INFO">
            <BoxContentLine>
              <Text>No components are installed to uninstall.</Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text></Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text>Press any key to return to the main menu.</Text>
            </BoxContentLine>
          </BoxDecorated>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>━━━ 🗑️ COMPONENT SELECTION (UNINSTALL) 🗑️ ━━━</Text>
        <Text></Text>

        <BoxDecorated title="Select components to uninstall:">
          {availableUninstallComponents.map((comp: ComponentInfo, idx: number) => {
            const statusText = formatComponentStatus(state[comp.key].installed);
            
            return (
              <React.Fragment key={comp.key}>
                <BoxContentLine>
                  <Text>
                    <Text color="cyan">{idx + 1}</Text>. {comp.emoji} {comp.name}
                  </Text>
                </BoxContentLine>
                <BoxContentLine>
                  <Text>
                    {'   '}[<Text color="green">{statusText}</Text>] {comp.description}
                  </Text>
                </BoxContentLine>
              </React.Fragment>
            );
          })}
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text><Text color="red">A</Text>. 🗑️ Uninstall ALL components</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text><Text color="yellow">Q</Text>. ← Go back to main menu</Text>
          </BoxContentLine>
        </BoxDecorated>

        {confirmingAction && awaitingConfirmationType === 'uninstall' && (
          <Box marginTop={1} flexDirection="column">
            <Text bold>━━━ YOUR SELECTION ━━━</Text>
            <Text></Text>
            {selectedComponentsList.map((comp: ComponentInfo) => (
              <Text key={comp.key}>
                  <Text color="red">✗</Text> {comp.emoji} {comp.name}
              </Text>
            ))}
            <Text></Text>
            <Text color="red">⚠️ Ready to uninstall? (y/n):</Text>
          </Box>
        )}

        {!confirmingAction && (
          <Box marginTop={1}>
            <Text color="cyan">
              Enter numbers (e.g., "1 2 4") or "A" for all, "Q" to go back: {input}
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (screen === 'installing') {
    const progressSteps = [
      'Preparing installation...',
      'Checking system compatibility...',
      'Setting up environment...',
      'Ready to install!',
      'Let\'s go! 🎉',
    ];

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>━━━ 🚀 STARTING INSTALLATION! 🚀 ━━━</Text>
        <Text></Text>
        
        {assistantMessage && (
          <Box marginTop={1}>
            <Assistant mode={assistantMode} state={assistantState} message={assistantMessage} compact />
          </Box>
        )}
        
        <ProgressBar steps={progressSteps} currentStep={progressStep} />
        
        <Box marginTop={1} flexDirection="column">
          {installProgress.map((progress: InstallationProgress, idx: number) => (
            <Box key={idx}>
              <Text>
                {progress.status === 'success' && <Text color="green">✓</Text>}
                {progress.status === 'error' && <Text color="red">✗</Text>}
                {progress.status === 'inProgress' && <Text color="cyan">⋯</Text>}
                {' '}{progress.component} - {progress.stage}
                {progress.message && ` (${progress.message})`}
              </Text>
            </Box>
          ))}
        </Box>

        {selectedComponents.has('mpd') && (
          <Box marginTop={1}>
            <Text color="cyan">{ASCII_ART.music}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (screen === 'uninstalling') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold>━━━ 🗑️ STARTING UNINSTALL ━━━</Text>
        <Text></Text>
        
        {assistantMessage && (
          <Box marginTop={1}>
            <Assistant mode={assistantMode} state='warning' message={getAssistantMessage(assistantMode, 'beforeUninstall')} compact />
          </Box>
        )}
        
        <LoadingAnimation message="Uninstalling components..." />

        <Box marginTop={1} flexDirection="column">
          {selectedComponentsList.map((comp: ComponentInfo) => (
            <Text key={comp.key}>
              <Text color="yellow">⋯</Text> Uninstalling {comp.emoji} {comp.name}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  if (screen === 'complete') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green">{ASCII_ART.celebration}</Text>

        <BoxDecorated title="🎉 INSTALLATION COMPLETE! 🎉">
          <BoxContentLine>
            <Text color="green">Awesome! Your Conductor is ready to rock! 🎸</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text bold>NEXT STEPS:</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  1. 📁 Add music files to ~/Music/</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  2. 🚀 Run: <Text color="cyan">bun start</Text> (or npm start)</Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text>  3. 🎤 Try saying: <Text color="magenta">"play some jazz"</Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text></Text>
          </BoxContentLine>
          <BoxContentLine>
            <Text color="green">Enjoy your music! 🎵✨</Text>
          </BoxContentLine>
        </BoxDecorated>

        <Box marginTop={1}>
          <Text color="cyan">Want to add more components? (y/n):</Text>
        </Box>
      </Box>
    );
  }

  if (screen === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="red">━━━ ⚠️ OOPS! SOMETHING WENT WRONG ━━━</Text>
        <Text></Text>
        
        <Box marginTop={1}>
          <Assistant 
            mode={assistantMode} 
            state='error' 
            message={assistantMessage || "Don't worry! Errors happen and we can fix this together. Let's figure out what went wrong and try again."} 
          />
        </Box>
        
        <Box marginTop={1}>
          <Text color="red">✗ Error: {errorMessage}</Text>
        </Box>
        
        <Box marginTop={1}>
          <BoxDecorated title="💡 TROUBLESHOOTING TIPS">
            <BoxContentLine>
              <Text>• Check your internet connection</Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text>• Make sure you have sufficient permissions (try sudo)</Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text>• Verify your system has enough disk space</Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text>• Try running the wizard again</Text>
            </BoxContentLine>
            <BoxContentLine>
              <Text>• Check SETUP.md for manual installation</Text>
            </BoxContentLine>
          </BoxDecorated>
        </Box>

        <Box marginTop={1}>
          <Text color="cyan">Want to try again? (Y to retry / N to exit):</Text>
        </Box>
      </Box>
    );
  }

  return null;
});

SetupWizard.displayName = 'SetupWizard';

export default SetupWizard;
