// Backend Setup Utility for Hermes Extension
// Helps users configure connection to the Recreated backend

import { BackendConfig, DEFAULT_BACKEND_CONFIG, saveBackendConfig, loadBackendConfig } from './backendConfig';

export interface BackendSetupOptions {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
}

// Default setup for Recreated backend
export const RECREATED_BACKEND_SETUP: BackendSetupOptions = {
  baseUrl: 'http://localhost:3000', // Default local development
  apiVersion: 'v1',
  timeout: 10000,
  retries: 3
};

// Setup backend configuration
export async function setupBackend(options: BackendSetupOptions = RECREATED_BACKEND_SETUP): Promise<void> {
  try {
    const currentConfig = await loadBackendConfig();
    
    const newConfig: BackendConfig = {
      ...DEFAULT_BACKEND_CONFIG,
      ...currentConfig,
      ...options,
      endpoints: {
        ...DEFAULT_BACKEND_CONFIG.endpoints,
        ...currentConfig.endpoints
      }
    };

    await saveBackendConfig(newConfig);
    
    console.log('🔧 Hermes: Backend configuration updated for Recreated folder');
    console.log('📍 Backend URL:', newConfig.baseUrl);
    console.log('📋 API Version:', newConfig.apiVersion);
  } catch (error) {
    console.error('Failed to setup backend configuration:', error);
  }
}

// Quick setup for common environments
export const BACKEND_ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:3000',
    description: 'Local development server'
  },
  development: {
    baseUrl: 'http://localhost:3001',
    description: 'Development server'
  },
  staging: {
    baseUrl: 'https://staging.hermes-backend.com',
    description: 'Staging environment'
  },
  production: {
    baseUrl: 'https://api.hermes-backend.com',
    description: 'Production environment'
  }
};

// Setup for specific environment
export async function setupEnvironment(environment: keyof typeof BACKEND_ENVIRONMENTS): Promise<void> {
  const envConfig = BACKEND_ENVIRONMENTS[environment];
  if (!envConfig) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  await setupBackend({
    baseUrl: envConfig.baseUrl
  });
}

// Test backend connection
export async function testBackendConnection(config?: BackendConfig): Promise<{
  connected: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const testConfig = config || await loadBackendConfig();
    const response = await fetch(`${testConfig.baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(testConfig.timeout)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        connected: true,
        responseTime
      };
    } else {
      return {
        connected: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      connected: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get backend status
export async function getBackendStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  config: BackendConfig | null;
  lastTest?: {
    connected: boolean;
    responseTime: number;
    error?: string;
  };
}> {
  try {
    const config = await loadBackendConfig();
    const testResult = await testBackendConnection(config);
    
    return {
      configured: true,
      connected: testResult.connected,
      config,
      lastTest: testResult
    };
  } catch (error) {
    return {
      configured: false,
      connected: false,
      config: null
    };
  }
}

// Reset to default configuration
export async function resetBackendConfig(): Promise<void> {
  await saveBackendConfig(DEFAULT_BACKEND_CONFIG);
  console.log('🔄 Hermes: Backend configuration reset to defaults');
}

// Validate backend configuration
export function validateBackendConfig(config: BackendConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  } else if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
    errors.push('Base URL must start with http:// or https://');
  }

  if (!config.apiVersion) {
    errors.push('API version is required');
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
    errors.push('Timeout must be between 1000ms and 60000ms');
  }

  if (config.retries && (config.retries < 1 || config.retries > 10)) {
    errors.push('Retries must be between 1 and 10');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Auto-detect backend URL (for development)
export async function autoDetectBackend(): Promise<string | null> {
  const commonPorts = [3000, 3001, 8080, 8000, 5000];
  
  for (const port of commonPorts) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        return `http://localhost:${port}`;
      }
    } catch (error) {
      // Continue to next port
    }
  }
  
  return null;
}

// Setup with auto-detection
export async function setupBackendWithAutoDetection(): Promise<boolean> {
  const detectedUrl = await autoDetectBackend();
  
  if (detectedUrl) {
    await setupBackend({ baseUrl: detectedUrl });
    console.log('🎯 Hermes: Auto-detected backend at', detectedUrl);
    return true;
  } else {
    console.log('⚠️ Hermes: No backend detected, using default configuration');
    return false;
  }
} 