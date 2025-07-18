/**
 * BMC Remedy/Helix Connector
 * 
 * Provides enterprise integration with BMC Remedy/Helix platform:
 * - REST API integration
 * - Basic authentication
 * - Incident, Change, and Request management
 * - Enhanced work notes and notes handling (large text areas)
 * - Field mapping and data transformation
 * - Configurable work notes settings
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class RemedyConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.authToken = null;
    this.tokenExpiry = null;
    
    // BMC Remedy specific rate limits
    this.rateLimitQueue = [];
    this.maxRequestsPerMinute = 30;
    this.maxRequestsPerHour = 500;
    
    // Work notes configuration
    this.workNotesConfig = config.workNotes || {
      enabled: true,
      autoTimestamp: true,
      includeUser: true,
      template: 'work_notes',
      maxLength: 32000,
      appendMode: true
    };
    
    // Notes configuration
    this.notesConfig = config.notes || {
      enabled: true,
      autoTimestamp: true,
      template: 'notes',
      maxLength: 32000,
      appendMode: true
    };
  }

  /**
   * Validate BMC Remedy configuration
   * @param {Object} config - Configuration object
   * @returns {boolean} Configuration validity
   */
  validateConfig(config) {
    const required = ['baseUrl', 'username', 'password'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required BMC Remedy config: ${missing.join(', ')}`);
    }

    // Validate base URL format
    if (!config.baseUrl.match(/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?$/)) {
      throw new Error('Invalid BMC Remedy base URL format');
    }

    return true;
  }

  /**
   * Authenticate with BMC Remedy using basic auth
   * @returns {Promise<boolean>} Authentication success
   */
  async authenticate() {
    try {
      if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        this.authenticated = true;
        return true;
      }

      // Basic authentication
      const authResponse = await this.client.post(`${this.baseUrl}/api/jwt/login`, {
        username: this.username,
        password: this.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.authToken = authResponse.data.ARJWT;
      this.tokenExpiry = Date.now() + (3600 * 1000); // 1 hour
      this.authenticated = true;

      logger.info('BMC Remedy authentication successful', {
        baseUrl: this.baseUrl,
        username: this.username
      });

      return true;

    } catch (error) {
      logger.error('BMC Remedy authentication failed:', error);
      throw new Error(`BMC Remedy authentication failed: ${error.message}`);
    }
  }

  /**
   * Apply BMC Remedy-specific rate limiting
   * @returns {Promise<void>}
   */
  async applyRateLimit() {
    const now = Date.now();
    const minuteWindow = 60000;
    const hourWindow = 3600000;

    // Clean old requests
    this.rateLimitQueue = this.rateLimitQueue.filter(
      timestamp => now - timestamp < hourWindow
    );

    // Check minute limit
    const minuteRequests = this.rateLimitQueue.filter(
      timestamp => now - timestamp < minuteWindow
    );

    if (minuteRequests.length >= this.maxRequestsPerMinute) {
      const oldestRequest = minuteRequests[0];
      const waitTime = minuteWindow - (now - oldestRequest);
      
      logger.warn(`BMC Remedy minute rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    // Check hour limit
    if (this.rateLimitQueue.length >= this.maxRequestsPerHour) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = hourWindow - (now - oldestRequest);
      
      logger.warn(`BMC Remedy hour rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.rateLimitQueue.push(now);
  }

  /**
   * Get incidents from BMC Remedy
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} List of incidents
   */
  async getIncidents(filters = {}) {
    const query = this.buildQuery(filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Accept': 'application/json'
      },
      params: {
        q: query,
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }
    });

    return response.entries.map(entry => this.transformIncident(entry.values));
  }

  /**
   * Create incident in BMC Remedy
   * @param {Object} incidentData - Incident data
   * @returns {Promise<Object>} Created incident
   */
  async createIncident(incidentData) {
    const transformedData = this.transformToRemedy(incidentData);
    
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        values: transformedData
      }
    });

    return this.transformIncident(response.values);
  }

  /**
   * Update incident in BMC Remedy
   * @param {string} incidentId - Incident entry ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated incident
   */
  async updateIncident(incidentId, updateData) {
    const transformedData = this.transformToRemedy(updateData);
    
    const response = await this.makeRequest({
      method: 'PUT',
      url: `${this.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface/${incidentId}`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        values: transformedData
      }
    });

    return this.transformIncident(response.values);
  }

  /**
   * Add work notes to incident with enhanced handling
   * @param {string} incidentId - Incident entry ID
   * @param {string} workNotes - Work notes content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated incident
   */
  async addWorkNotes(incidentId, workNotes, options = {}) {
    if (!this.workNotesConfig.enabled) {
      throw new Error('Work notes are disabled in configuration');
    }

    const timestamp = this.workNotesConfig.autoTimestamp ? 
      new Date().toISOString() : '';
    
    const user = this.workNotesConfig.includeUser ? 
      `[${this.username}]` : '';
    
    let formattedNotes = workNotes;
    
    if (timestamp || user) {
      const prefix = [timestamp, user].filter(Boolean).join(' ');
      formattedNotes = `${prefix} ${workNotes}`;
    }

    // Apply template if configured
    if (this.workNotesConfig.template) {
      formattedNotes = this.applyWorkNotesTemplate(formattedNotes);
    }

    // Check length limit
    if (formattedNotes.length > this.workNotesConfig.maxLength) {
      logger.warn('Work notes exceed maximum length, truncating', {
        incidentId,
        originalLength: formattedNotes.length,
        maxLength: this.workNotesConfig.maxLength
      });
      formattedNotes = formattedNotes.substring(0, this.workNotesConfig.maxLength);
    }

    const updateData = {};
    
    if (this.workNotesConfig.appendMode) {
      // Get existing work notes and append
      const existingIncident = await this.getIncident(incidentId);
      const existingNotes = existingIncident.workNotes || '';
      updateData.workNotes = existingNotes + '\n\n' + formattedNotes;
    } else {
      updateData.workNotes = formattedNotes;
    }

    return this.updateIncident(incidentId, updateData);
  }

  /**
   * Add notes to incident with enhanced handling
   * @param {string} incidentId - Incident entry ID
   * @param {string} notes - Notes content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated incident
   */
  async addNotes(incidentId, notes, options = {}) {
    if (!this.notesConfig.enabled) {
      throw new Error('Notes are disabled in configuration');
    }

    const timestamp = this.notesConfig.autoTimestamp ? 
      new Date().toISOString() : '';
    
    let formattedNotes = notes;
    
    if (timestamp) {
      formattedNotes = `[${timestamp}] ${notes}`;
    }

    // Apply template if configured
    if (this.notesConfig.template) {
      formattedNotes = this.applyNotesTemplate(formattedNotes);
    }

    // Check length limit
    if (formattedNotes.length > this.notesConfig.maxLength) {
      logger.warn('Notes exceed maximum length, truncating', {
        incidentId,
        originalLength: formattedNotes.length,
        maxLength: this.notesConfig.maxLength
      });
      formattedNotes = formattedNotes.substring(0, this.notesConfig.maxLength);
    }

    const updateData = {};
    
    if (this.notesConfig.appendMode) {
      // Get existing notes and append
      const existingIncident = await this.getIncident(incidentId);
      const existingNotes = existingIncident.notes || '';
      updateData.notes = existingNotes + '\n\n' + formattedNotes;
    } else {
      updateData.notes = formattedNotes;
    }

    return this.updateIncident(incidentId, updateData);
  }

  /**
   * Get single incident by ID
   * @param {string} incidentId - Incident entry ID
   * @returns {Promise<Object>} Incident data
   */
  async getIncident(incidentId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface/${incidentId}`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Accept': 'application/json'
      }
    });

    return this.transformIncident(response.values);
  }

  /**
   * Get change requests from BMC Remedy
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} List of change requests
   */
  async getChangeRequests(filters = {}) {
    const query = this.buildQuery(filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/arsys/v1/entry/CHG:ChangeInterface`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Accept': 'application/json'
      },
      params: {
        q: query,
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }
    });

    return response.entries.map(entry => this.transformChangeRequest(entry.values));
  }

  /**
   * Get request items from BMC Remedy
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} List of request items
   */
  async getRequestItems(filters = {}) {
    const query = this.buildQuery(filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/arsys/v1/entry/SHR:RequestInterface`,
      headers: {
        'Authorization': `ARJWT ${this.authToken}`,
        'Accept': 'application/json'
      },
      params: {
        q: query,
        limit: filters.limit || 100,
        offset: filters.offset || 0
      }
    });

    return response.entries.map(entry => this.transformRequestItem(entry.values));
  }

  /**
   * Build BMC Remedy query string from filters
   * @param {Object} filters - Query filters
   * @returns {string} Query string
   */
  buildQuery(filters) {
    const conditions = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'offset' && value !== undefined) {
        if (typeof value === 'string') {
          conditions.push(`'${key}' LIKE "${value}"`);
        } else {
          conditions.push(`'${key}' = "${value}"`);
        }
      }
    });

    return conditions.join(' AND ');
  }

  /**
   * Apply work notes template
   * @param {string} content - Original content
   * @returns {string} Templated content
   */
  applyWorkNotesTemplate(content) {
    const templates = {
      work_notes: `=== WORK NOTES ===\n${content}\n=== END WORK NOTES ===`,
      technical: `=== TECHNICAL NOTES ===\n${content}\n=== END TECHNICAL NOTES ===`,
      customer: `=== CUSTOMER COMMUNICATION ===\n${content}\n=== END CUSTOMER COMMUNICATION ===`
    };

    return templates[this.workNotesConfig.template] || content;
  }

  /**
   * Apply notes template
   * @param {string} content - Original content
   * @returns {string} Templated content
   */
  applyNotesTemplate(content) {
    const templates = {
      notes: `=== NOTES ===\n${content}\n=== END NOTES ===`,
      internal: `=== INTERNAL NOTES ===\n${content}\n=== END INTERNAL NOTES ===`,
      public: `=== PUBLIC NOTES ===\n${content}\n=== END PUBLIC NOTES ===`
    };

    return templates[this.notesConfig.template] || content;
  }

  /**
   * Transform BMC Remedy incident to Hermes format
   * @param {Object} incident - BMC Remedy incident
   * @returns {Object} Transformed incident
   */
  transformIncident(incident) {
    return {
      id: incident['Incident Number'],
      number: incident['Incident Number'],
      shortDescription: incident['Short Description'],
      description: incident['Description'],
      priority: incident['Priority'],
      urgency: incident['Urgency'],
      impact: incident['Impact'],
      status: incident['Status'],
      category: incident['Category'],
      subcategory: incident['Subcategory'],
      assignedTo: incident['Assigned To'],
      openedBy: incident['Submitter'],
      openedAt: incident['Submit Date'],
      updatedAt: incident['Last Modified Date'],
      workNotes: incident['Work Notes'],
      notes: incident['Notes'],
      company: incident['Company'],
      location: incident['Location'],
      contactName: incident['Contact Name'],
      contactPhone: incident['Contact Phone'],
      contactEmail: incident['Contact Email']
    };
  }

  /**
   * Transform BMC Remedy change request to Hermes format
   * @param {Object} change - BMC Remedy change request
   * @returns {Object} Transformed change request
   */
  transformChangeRequest(change) {
    return {
      id: change['Change ID'],
      number: change['Change ID'],
      shortDescription: change['Short Description'],
      description: change['Description'],
      priority: change['Priority'],
      risk: change['Risk Level'],
      impact: change['Impact'],
      status: change['Status'],
      type: change['Change Type'],
      category: change['Category'],
      assignedTo: change['Assigned To'],
      requestedBy: change['Requestor'],
      requestedAt: change['Submit Date'],
      plannedStart: change['Planned Start Date'],
      plannedEnd: change['Planned End Date'],
      workNotes: change['Work Notes'],
      implementationPlan: change['Implementation Plan'],
      testPlan: change['Test Plan'],
      backoutPlan: change['Backout Plan']
    };
  }

  /**
   * Transform BMC Remedy request item to Hermes format
   * @param {Object} item - BMC Remedy request item
   * @returns {Object} Transformed request item
   */
  transformRequestItem(item) {
    return {
      id: item['Request ID'],
      number: item['Request ID'],
      shortDescription: item['Short Description'],
      description: item['Description'],
      priority: item['Priority'],
      status: item['Status'],
      stage: item['Stage'],
      category: item['Category'],
      assignedTo: item['Assigned To'],
      requestedBy: item['Requestor'],
      requestedAt: item['Submit Date'],
      updatedAt: item['Last Modified Date'],
      workNotes: item['Work Notes'],
      notes: item['Notes'],
      price: item['Price'],
      quantity: item['Quantity'],
      total: item['Total Cost']
    };
  }

  /**
   * Transform Hermes data to BMC Remedy format
   * @param {Object} data - Hermes data
   * @returns {Object} BMC Remedy formatted data
   */
  transformToRemedy(data) {
    const transformed = {};
    
    // Map common fields
    const fieldMappings = {
      shortDescription: 'Short Description',
      description: 'Description',
      priority: 'Priority',
      urgency: 'Urgency',
      impact: 'Impact',
      status: 'Status',
      category: 'Category',
      subcategory: 'Subcategory',
      assignedTo: 'Assigned To',
      workNotes: 'Work Notes',
      notes: 'Notes',
      company: 'Company',
      location: 'Location',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',
      contactEmail: 'Contact Email'
    };

    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = fieldMappings[key] || key;
      transformed[mappedKey] = value;
    });

    return transformed;
  }

  /**
   * Get BMC Remedy platform capabilities
   * @returns {Object} Platform capabilities
   */
  static getCapabilities() {
    return {
      platform: 'BMC Remedy/Helix',
      version: '1.0.0',
      features: [
        'incident_management',
        'change_management',
        'request_management',
        'work_notes',
        'notes',
        'large_text_handling',
        'field_mapping',
        'basic_authentication',
        'rate_limiting',
        'retry_logic',
        'configurable_notes'
      ],
      forms: [
        'HPD:IncidentInterface',
        'CHG:ChangeInterface',
        'SHR:RequestInterface',
        'PPL:PeopleInterface',
        'AST:AssetInterface'
      ],
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 500
      },
      authentication: 'basic',
      apiVersion: 'v1',
      workNotesConfig: {
        enabled: true,
        autoTimestamp: true,
        includeUser: true,
        template: 'work_notes',
        maxLength: 32000,
        appendMode: true
      },
      notesConfig: {
        enabled: true,
        autoTimestamp: true,
        template: 'notes',
        maxLength: 32000,
        appendMode: true
      }
    };
  }

  /**
   * Get required BMC Remedy configuration fields
   * @returns {Array} Required configuration fields
   */
  static getRequiredConfig() {
    return [
      'baseUrl',
      'username',
      'password'
    ];
  }
}

module.exports = RemedyConnector; 