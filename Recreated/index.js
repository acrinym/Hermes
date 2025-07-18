/**
 * Hermes Enterprise Connectors
 * 
 * This module provides enterprise-grade connectors for major SaaS platforms:
 * - ServiceNow
 * - BMC Remedy/Helix
 * - Salesforce
 * - Jira
 * - Zendesk
 * - Freshdesk
 * 
 * Each connector handles:
 * - Authentication & API integration
 * - Data mapping & transformation
 * - Error handling & retry logic
 * - Rate limiting & throttling
 * - Logging & monitoring
 */

const ServiceNowConnector = require('./servicenow');
const RemedyConnector = require('./remedy');
const SalesforceConnector = require('./salesforce');
const JiraConnector = require('./jira');
const ZendeskConnector = require('./zendesk');
const FreshdeskConnector = require('./freshdesk');

// Connector factory
class ConnectorFactory {
  constructor() {
    this.connectors = {
      servicenow: ServiceNowConnector,
      remedy: RemedyConnector,
      salesforce: SalesforceConnector,
      jira: JiraConnector,
      zendesk: ZendeskConnector,
      freshdesk: FreshdeskConnector
    };
  }

  /**
   * Get connector instance for a platform
   * @param {string} platform - Platform name
   * @param {Object} config - Connection configuration
   * @returns {Object} Connector instance
   */
  getConnector(platform, config) {
    const ConnectorClass = this.connectors[platform.toLowerCase()];
    if (!ConnectorClass) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return new ConnectorClass(config);
  }

  /**
   * Get list of supported platforms
   * @returns {Array} List of platform names
   */
  getSupportedPlatforms() {
    return Object.keys(this.connectors);
  }

  /**
   * Test connection to a platform
   * @param {string} platform - Platform name
   * @param {Object} config - Connection configuration
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(platform, config) {
    try {
      const connector = this.getConnector(platform, config);
      return await connector.testConnection();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Get platform capabilities
   * @param {string} platform - Platform name
   * @returns {Object} Platform capabilities
   */
  getPlatformCapabilities(platform) {
    const ConnectorClass = this.connectors[platform.toLowerCase()];
    if (!ConnectorClass) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return ConnectorClass.getCapabilities();
  }
}

// Export factory and individual connectors
module.exports = {
  ConnectorFactory,
  ServiceNowConnector,
  RemedyConnector,
  SalesforceConnector,
  JiraConnector,
  ZendeskConnector,
  FreshdeskConnector
}; 