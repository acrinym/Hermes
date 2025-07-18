/**
 * ServiceNow Connector
 * 
 * Provides enterprise integration with ServiceNow platform:
 * - REST API v2 integration
 * - OAuth 2.0 authentication
 * - Incident, Change, and Request management
 * - Work notes and comments handling
 * - Field mapping and data transformation
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class ServiceNowConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = config.instance_url;
    this.apiVersion = 'v2';
    this.rateLimitPerMinute = 100;
  }

  async authenticate() {
    try {
      // ServiceNow uses OAuth 2.0 or Basic Auth
      if (this.config.auth_type === 'oauth2') {
        await this.authenticateOAuth2();
      } else {
        await this.authenticateBasic();
      }
      
      this.authenticated = true;
      this.lastAuthTime = new Date();
      this.authExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      logger.info('ServiceNow authentication successful');
    } catch (error) {
      logger.error('ServiceNow authentication failed:', error);
      throw error;
    }
  }

  async authenticateOAuth2() {
    const tokenResponse = await this.client.post(`${this.baseUrl}/oauth_token.do`, {
      grant_type: 'password',
      username: this.config.username,
      password: this.config.password,
      client_id: this.config.client_id,
      client_secret: this.config.client_secret
    });

    this.accessToken = tokenResponse.data.access_token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async authenticateBasic() {
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
  }

  async getIncidents(filters = {}) {
    const query = this.buildQuery('incident', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/now/table/incident`,
      params: { sysparm_query: query, sysparm_limit: 100 }
    });
    
    return this.transformData(response.result);
  }

  async getIncident(sysId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/now/table/incident/${sysId}`
    });
    
    return this.transformData(response.result);
  }

  async createIncident(incidentData) {
    const transformedData = this.transformToPlatform(incidentData);
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.baseUrl}/api/now/table/incident`,
      data: transformedData
    });
    
    return this.transformData(response.result);
  }

  async updateIncident(sysId, updateData) {
    const transformedData = this.transformToPlatform(updateData);
    const response = await this.makeRequest({
      method: 'PUT',
      url: `${this.baseUrl}/api/now/table/incident/${sysId}`,
      data: transformedData
    });
    
    return this.transformData(response.result);
  }

  async addWorkNotes(sysId, notes, options = {}) {
    const workNotesData = {
      work_notes: this.formatWorkNotes(notes, options)
    };
    
    return this.updateIncident(sysId, workNotesData);
  }

  async addNotes(sysId, notes, options = {}) {
    const notesData = {
      comments: this.formatNotes(notes, options)
    };
    
    return this.updateIncident(sysId, notesData);
  }

  async getChangeRequests(filters = {}) {
    const query = this.buildQuery('change_request', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/now/table/change_request`,
      params: { sysparm_query: query, sysparm_limit: 100 }
    });
    
    return this.transformData(response.result);
  }

  async getRequestItems(filters = {}) {
    const query = this.buildQuery('sc_req_item', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/now/table/sc_req_item`,
      params: { sysparm_query: query, sysparm_limit: 100 }
    });
    
    return this.transformData(response.result);
  }

  buildQuery(table, filters) {
    const conditions = [];
    
    if (filters.number) conditions.push(`number=${filters.number}`);
    if (filters.state) conditions.push(`state=${filters.state}`);
    if (filters.assigned_to) conditions.push(`assigned_to=${filters.assigned_to}`);
    if (filters.category) conditions.push(`category=${filters.category}`);
    if (filters.priority) conditions.push(`priority=${filters.priority}`);
    if (filters.created_by) conditions.push(`created_by=${filters.created_by}`);
    if (filters.sys_created_on) conditions.push(`sys_created_on>=${filters.sys_created_on}`);
    
    return conditions.join('^');
  }

  formatWorkNotes(notes, options = {}) {
    let formattedNotes = notes;
    
    if (options.autoTimestamp) {
      const timestamp = new Date().toISOString();
      formattedNotes = `[${timestamp}] ${formattedNotes}`;
    }
    
    if (options.includeUser && this.config.username) {
      formattedNotes = `[${this.config.username}] ${formattedNotes}`;
    }
    
    if (options.appendMode) {
      // For append mode, we'd need to get existing notes first
      // This is a simplified version
      return formattedNotes;
    }
    
    return formattedNotes;
  }

  formatNotes(notes, options = {}) {
    let formattedNotes = notes;
    
    if (options.autoTimestamp) {
      const timestamp = new Date().toISOString();
      formattedNotes = `[${timestamp}] ${formattedNotes}`;
    }
    
    if (options.appendMode) {
      // For append mode, we'd need to get existing notes first
      return formattedNotes;
    }
    
    return formattedNotes;
  }

  transformData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.transformIncident(item));
    }
    return this.transformIncident(data);
  }

  transformIncident(incident) {
    return {
      id: incident.sys_id,
      number: incident.number,
      short_description: incident.short_description,
      description: incident.description,
      state: incident.state,
      priority: incident.priority,
      category: incident.category,
      assigned_to: incident.assigned_to,
      created_by: incident.created_by,
      created_at: incident.sys_created_on,
      updated_at: incident.sys_updated_on,
      work_notes: incident.work_notes,
      comments: incident.comments,
      // Add any other fields as needed
    };
  }

  transformToPlatform(data) {
    return {
      short_description: data.short_description,
      description: data.description,
      state: data.state,
      priority: data.priority,
      category: data.category,
      assigned_to: data.assigned_to,
      // Add any other fields as needed
    };
  }

  validateConfig(config) {
    const required = ['instance_url', 'username', 'password'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required ServiceNow config fields: ${missing.join(', ')}`);
    }
    
    if (config.auth_type === 'oauth2') {
      if (!config.client_id || !config.client_secret) {
        throw new Error('OAuth2 requires client_id and client_secret');
      }
    }
    
    return true;
  }

  static getCapabilities() {
    return {
      platform: 'servicenow',
      version: 'v2',
      operations: [
        'get_incidents',
        'create_incident',
        'update_incident',
        'add_work_notes',
        'add_notes',
        'get_change_requests',
        'get_request_items'
      ],
      authentication: ['basic', 'oauth2'],
      rateLimit: '100 requests per minute',
      features: {
        workNotes: true,
        notes: true,
        attachments: true,
        customFields: true
      }
    };
  }

  static getRequiredConfig() {
    return {
      instance_url: 'ServiceNow instance URL (e.g., https://yourcompany.service-now.com)',
      username: 'ServiceNow username',
      password: 'ServiceNow password',
      auth_type: 'Authentication type (basic or oauth2)',
      client_id: 'OAuth2 client ID (required for oauth2)',
      client_secret: 'OAuth2 client secret (required for oauth2)'
    };
  }
}

module.exports = ServiceNowConnector; 