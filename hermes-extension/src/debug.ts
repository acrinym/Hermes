// Debug utility for Hermes extension
// Centralizes debug logging and makes it configurable

export interface DebugConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  includeTimestamps: boolean;
}

let debugConfig: DebugConfig = {
  enabled: false,
  level: 'warn',
  includeTimestamps: false
};

export function setDebugConfig(config: Partial<DebugConfig>) {
  debugConfig = { ...debugConfig, ...config };
}

export function isDebugEnabled(): boolean {
  return debugConfig.enabled;
}

export function shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
  if (!debugConfig.enabled) return false;
  
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  return levels[level] <= levels[debugConfig.level];
}

export function debugLog(level: 'error' | 'warn' | 'info' | 'debug', message: string, ...args: any[]) {
  if (!shouldLog(level)) return;
  
  const timestamp = debugConfig.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
  const prefix = `[Hermes ${level.toUpperCase()}] ${timestamp}`;
  
  switch (level) {
    case 'error':
      console.error(prefix + message, ...args);
      break;
    case 'warn':
      console.warn(prefix + message, ...args);
      break;
    case 'info':
      console.info(prefix + message, ...args);
      break;
    case 'debug':
      console.log(prefix + message, ...args);
      break;
  }
}

// Convenience functions
export const debug = {
  error: (message: string, ...args: any[]) => debugLog('error', message, ...args),
  warn: (message: string, ...args: any[]) => debugLog('warn', message, ...args),
  info: (message: string, ...args: any[]) => debugLog('info', message, ...args),
  log: (message: string, ...args: any[]) => debugLog('debug', message, ...args)
};

// Initialize debug mode from storage
export async function initDebugMode(): Promise<void> {
  try {
    const data = await chrome.storage.local.get('hermes_debug_config');
    if (data.hermes_debug_config) {
      setDebugConfig(data.hermes_debug_config);
    }
  } catch (error) {
    // Silently fail if storage is not available
  }
}
