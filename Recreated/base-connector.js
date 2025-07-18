/**
 * Base Connector Class
 * 
 * Provides common functionality for all enterprise platform connectors:
 * - Authentication management
 * - Rate limiting and throttling
 * - Error handling and retry logic
 * - Logging and monitoring
 * - Data transformation utilities
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

class BaseConnector {
  constructor(config) {
    this.config = config;
    this.authenticated = false;
    this.lastAuthTime = null;
    this.authExpiry = null;
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
    
    // Setup axios instance with base configuration
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hermes-Enterprise/1.0'
      }
    });
    
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for logging and auth
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for rate limiting and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit info from headers
        if (response.headers['x-ratelimit-remaining']) {
          this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining']);
        }
        if (response.headers['x-ratelimit-reset']) {
          this.rateLimitReset = new Date(parseInt(response.headers['x-ratelimit-reset']) * 1000);
        }
        
        logger.debug(`Response received: ${response.status} from ${response.config.url}`);
        return response;
      },
      async (error) => {
        logger.error('Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 60;
          logger.warn(`Rate limited, waiting ${retryAfter} seconds`);
          await this.delay(retryAfter * 1000);
          return this.client.request(error.config);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          logger.warn('Authentication failed, attempting re-auth');
          this.authenticated = false;
          await this.authenticate();
          return this.client.request(error.config);
        }

        return Promise.reject(error);
      }
    );
  }

  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  async testConnection() {
    try {
      await this.authenticate();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      logger.error('Connection test failed:', error);
      return { success: false, message: error.message };
    }
  }

  async makeRequest(requestConfig, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      await this.applyRateLimit();
      
      if (!this.authenticated || this.isAuthExpired()) {
        await this.authenticate();
      }

      const response = await this.client.request(requestConfig);
      return response.data;
    } catch (error) {
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        logger.warn(`Retrying request (${retryCount + 1}/${maxRetries})`);
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequest(requestConfig, retryCount + 1);
      }
      throw error;
    }
  }

  async applyRateLimit() {
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining <= 1) {
      const waitTime = this.rateLimitReset ? 
        Math.max(0, this.rateLimitReset.getTime() - Date.now()) : 
        1000;
      
      if (waitTime > 0) {
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isAuthExpired() {
    return this.authExpiry && Date.now() >= this.authExpiry.getTime();
  }

  shouldRetry(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.response?.status);
  }

  transformData(data) {
    // Default transformation - subclasses can override
    return data;
  }

  transformToPlatform(data) {
    // Default transformation - subclasses can override
    return data;
  }

  validateConfig(config) {
    throw new Error('validateConfig() must be implemented by subclass');
  }

  static getCapabilities() {
    throw new Error('getCapabilities() must be implemented by subclass');
  }

  static getRequiredConfig() {
    throw new Error('getRequiredConfig() must be implemented by subclass');
  }
}

module.exports = BaseConnector; 