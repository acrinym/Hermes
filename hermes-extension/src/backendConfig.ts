// Backend Configuration for Hermes Extension
// Manages connections to the Recreated backend server and SaaS connectors

export interface SaaSConnectorConfig {
  baseUrl: string;
  apiVersion: string;
  authEndpoint: string;
  dataRoute: string;
  mapping: Record<string, unknown>;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    token?: string;
  };
}

export interface BackendConfig {
  baseUrl: string;
  apiVersion: string;
  endpoints: {
    configs: string;
    connectors: string;
    sync: string;
    discovery: string;
    auth: string;
  };
  timeout: number;
  retries: number;
  saas?: Record<string, SaaSConnectorConfig>;
}

// Default connector configurations for common SaaS platforms
export const DEFAULT_CONNECTORS: Record<string, SaaSConnectorConfig> = {
  salesforce: {
    baseUrl: '',
    apiVersion: 'v57.0',
    authEndpoint: '/services/oauth2/token',
    dataRoute: '/services/data',
    mapping: {},
    credentials: {
      clientId: '',
      clientSecret: '',
      username: '',
      password: ''
    }
  },
  bmcHelix: {
    baseUrl: '',
    apiVersion: 'v1',
    authEndpoint: '/api/jwt/login',
    dataRoute: '/api/arsys/v1',
    mapping: {},
    credentials: {
      username: '',
      password: ''
    }
  }
};

// Default configuration pointing to Recreated backend
export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  baseUrl: 'http://localhost:3000', // Default local development
  apiVersion: 'v1',
  endpoints: {
    configs: '/api/v1/configs',
    connectors: '/api/v1/connectors',
    sync: '/api/v1/sync',
    discovery: '/api/v1/discovery',
    auth: '/api/v1/auth'
  },
  timeout: 10000, // 10 seconds
  retries: 3,
  saas: DEFAULT_CONNECTORS
};

// Backend API client for Hermes Extension
export class BackendAPI {
  private config: BackendConfig;
  private authToken: string | null = null;
  private connectorTokens: Record<string, { token: string; type: 'oauth' | 'apiKey' }> = {};

  private createTimeoutSignal(): AbortSignal {
    const anySignal: any = AbortSignal as any;
    if (typeof anySignal.timeout === 'function') {
      return anySignal.timeout(this.config.timeout);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.config.timeout);
    return controller.signal;
  }

  constructor(config: BackendConfig = DEFAULT_BACKEND_CONFIG) {
    this.config = config;
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // Get authentication token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Load connector tokens from secure storage
  async loadConnectorTokens(): Promise<void> {
    try {
      const data = await new Promise<any>(resolve => {
        chrome.storage.local.get('hermes_connector_tokens', res => resolve(res));
      });
      this.connectorTokens = data.hermes_connector_tokens || {};
    } catch (error) {
      console.error('Failed to load connector tokens:', error);
    }
  }

  // Save connector tokens to secure storage
  private async saveConnectorTokens(): Promise<void> {
    try {
      await new Promise<void>(resolve => {
        chrome.storage.local.set({ hermes_connector_tokens: this.connectorTokens }, () => resolve());
      });
    } catch (error) {
      console.error('Failed to save connector tokens:', error);
    }
  }

  // Authenticate a SaaS connector via OAuth or API key
  async authenticateConnector(platform: string): Promise<boolean> {
    const cfg = this.config.saas?.[platform];
    if (!cfg) return false;

    if (cfg.baseUrl && !cfg.baseUrl.startsWith('https://') && !cfg.baseUrl.startsWith('http://localhost')) {
      throw new Error('Connector baseUrl must use HTTPS');
    }

    try {
      // API key based auth
      if (cfg.credentials.token) {
        this.connectorTokens[platform] = { token: cfg.credentials.token, type: 'apiKey' };
        await this.saveConnectorTokens();
        return true;
      }

      const authUrl = `${cfg.baseUrl}${cfg.authEndpoint}`;
      const params = new URLSearchParams({
        grant_type: 'password',
        username: cfg.credentials.username || '',
        password: cfg.credentials.password || '',
        client_id: cfg.credentials.clientId || '',
        client_secret: cfg.credentials.clientSecret || ''
      });

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.config.retries; attempt++) {
        try {
          const response = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            signal: this.createTimeoutSignal()
          });

          if (!response.ok) {
            throw new Error(`Connector auth error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          const token = data.access_token || data.token;
          if (!token) throw new Error('No token returned from connector auth');
          this.connectorTokens[platform] = { token, type: 'oauth' };
          await this.saveConnectorTokens();
          return true;
        } catch (error) {
          lastError = error as Error;
          if (attempt < this.config.retries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      throw lastError || new Error('Connector authentication failed');
    } catch (error) {
      console.error(`Connector authentication failed for ${platform}:`, error);
      return false;
    }
  }

  // Get stored connector token
  private getConnectorToken(platform: string): { token: string; type: 'oauth' | 'apiKey' } | undefined {
    return this.connectorTokens[platform];
  }

  // Make authenticated request to backend
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
      throw new Error('HTTPS is required for backend connections');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Hermes-Backend': 'Recreated',
      'X-Hermes-Source': 'hermes-extension',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal: this.createTimeoutSignal()
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, config);

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Backend API request failed');
  }

  // Upload platform configuration
  async uploadConfig(config: any): Promise<void> {
    await this.request(this.config.endpoints.configs, {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        backendLocation: '/Hermes/Recreated/',
        source: 'hermes-extension',
        timestamp: Date.now()
      })
    });
  }

  // Get platform configurations
  async getConfigs(domain?: string): Promise<any[]> {
    const params = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    return this.request(`${this.config.endpoints.configs}${params}`);
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/health', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  // Get supported platforms
  async getSupportedPlatforms(): Promise<string[]> {
    return this.request(`${this.config.endpoints.connectors}/platforms`);
  }

  // Test platform connector
  async testConnector(platform: string, config: any): Promise<boolean> {
    try {
      const cfg = this.config.saas?.[platform];
      if (cfg && cfg.baseUrl && !cfg.baseUrl.startsWith('https://') && !cfg.baseUrl.startsWith('http://localhost')) {
        throw new Error('Connector baseUrl must use HTTPS');
      }
      await this.request(`${this.config.endpoints.connectors}/${platform}/test`, {
        method: 'POST',
        body: JSON.stringify(config)
      });
      return true;
    } catch (error) {
      console.error(`Platform connector test failed for ${platform}:`, error);
      return false;
    }
  }

  // Get customer data from a SaaS connector
  async getCustomerData(
    platform: string,
    query: Record<string, unknown> = {}
  ): Promise<any> {
    const params = new URLSearchParams(query as Record<string, string>);
    const qs = params.toString();
    const cfg = this.config.saas?.[platform];
    if (cfg && cfg.baseUrl && !cfg.baseUrl.startsWith('https://') && !cfg.baseUrl.startsWith('http://localhost')) {
      throw new Error('Connector baseUrl must use HTTPS');
    }
    const url = `${this.config.endpoints.connectors}/${platform}/customer`;
    const tokenInfo = this.getConnectorToken(platform);
    const urlWithQs = qs ? `${url}?${qs}` : url;
    if (tokenInfo) {
      const headers: HeadersInit = {};
      if (tokenInfo.type === 'apiKey') headers['X-API-Key'] = tokenInfo.token;
      else headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      return this.request(urlWithQs, { headers });
    }
    return this.request(urlWithQs);
  }

  // Update customer data in a SaaS connector
  async updateCustomerData(platform: string, data: any): Promise<void> {
    const cfg = this.config.saas?.[platform];
    if (cfg && cfg.baseUrl && !cfg.baseUrl.startsWith('https://') && !cfg.baseUrl.startsWith('http://localhost')) {
      throw new Error('Connector baseUrl must use HTTPS');
    }
    const tokenInfo = this.getConnectorToken(platform);
    const url = `${this.config.endpoints.connectors}/${platform}/customer`;
    if (tokenInfo) {
      const headers: HeadersInit = {};
      if (tokenInfo.type === 'apiKey') headers['X-API-Key'] = tokenInfo.token;
      else headers['Authorization'] = `Bearer ${tokenInfo.token}`;
      await this.request(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers
      });
    } else {
      await this.request(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  }

  // Sync with GitHub repository
  async syncWithGitHub(repoConfig: any): Promise<void> {
    await this.request(this.config.endpoints.sync, {
      method: 'POST',
      body: JSON.stringify({
        ...repoConfig,
        source: 'hermes-extension'
      })
    });
  }

  // Get discovery session
  async getDiscoverySession(sessionId: string): Promise<any> {
    return this.request(`${this.config.endpoints.discovery}/session/${sessionId}`);
  }

  // Update discovery session
  async updateDiscoverySession(sessionId: string, data: any): Promise<void> {
    await this.request(`${this.config.endpoints.discovery}/session/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

// Global backend API instance
export const backendAPI = new BackendAPI();

// Reload backend configuration at runtime when storage changes
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.hermes_backend_config) {
      const newCfg: BackendConfig =
        changes.hermes_backend_config.newValue || DEFAULT_BACKEND_CONFIG;
      Object.assign(backendAPI, new BackendAPI(newCfg));
      backendAPI.loadConnectorTokens();
    }
  });
}

// Load backend configuration from storage
export async function loadBackendConfig(): Promise<BackendConfig> {
  try {
    const data = await new Promise<any>(resolve => {
      chrome.storage.local.get('hermes_backend_config', res => resolve(res));
    });
    return data.hermes_backend_config || DEFAULT_BACKEND_CONFIG;
  } catch (error) {
    console.error('Failed to load backend config:', error);
    return DEFAULT_BACKEND_CONFIG;
  }
}

// Save backend configuration to storage
export async function saveBackendConfig(config: BackendConfig): Promise<void> {
  try {
    await new Promise<void>(resolve => {
      chrome.storage.local.set({ hermes_backend_config: config }, () => resolve());
    });
  } catch (error) {
    console.error('Failed to save backend config:', error);
  }
}

// Initialize backend API with stored configuration
export async function initializeBackendAPI(): Promise<void> {
  try {
    const config = await loadBackendConfig();
    Object.assign(backendAPI, new BackendAPI(config));
    await backendAPI.loadConnectorTokens();

    // Test connection
    const isConnected = await backendAPI.testConnection();
    console.log('🔗 Hermes: Backend connection status:', isConnected ? 'Connected' : 'Disconnected');
  } catch (error) {
    console.error('Failed to initialize backend API:', error);
  }
}
