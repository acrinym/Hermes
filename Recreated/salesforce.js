/**
 * Salesforce Connector
 * 
 * Provides enterprise integration with Salesforce platform:
 * - REST API v58.0 integration
 * - OAuth 2.0 authentication
 * - Cases, Leads, Opportunities management
 * - Custom objects support
 * - Field mapping and data transformation
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class SalesforceConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.instanceUrl = config.instanceUrl;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Salesforce specific rate limits
    this.rateLimitQueue = [];
    this.maxRequestsPerMinute = 150;
    this.maxRequestsPerHour = 2000;
  }

  validateConfig(config) {
    const required = ['clientId', 'clientSecret', 'username', 'password'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Salesforce config: ${missing.join(', ')}`);
    }

    return true;
  }

  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        this.authenticated = true;
        return true;
      }

      // OAuth 2.0 password flow
      const tokenResponse = await this.client.post('https://login.salesforce.com/services/oauth2/token', {
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: this.config.username,
        password: this.config.password + (this.config.securityToken || '')
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = tokenResponse.data.access_token;
      this.refreshToken = tokenResponse.data.refresh_token;
      this.instanceUrl = tokenResponse.data.instance_url;
      this.tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
      this.authenticated = true;

      logger.info('Salesforce authentication successful', {
        instanceUrl: this.instanceUrl,
        expiresIn: tokenResponse.data.expires_in
      });

      return true;

    } catch (error) {
      logger.error('Salesforce authentication failed:', error);
      throw new Error(`Salesforce authentication failed: ${error.message}`);
    }
  }

  async applyRateLimit() {
    const now = Date.now();
    const minuteWindow = 60000;
    const hourWindow = 3600000;

    this.rateLimitQueue = this.rateLimitQueue.filter(
      timestamp => now - timestamp < hourWindow
    );

    const minuteRequests = this.rateLimitQueue.filter(
      timestamp => now - timestamp < minuteWindow
    );

    if (minuteRequests.length >= this.maxRequestsPerMinute) {
      const oldestRequest = minuteRequests[0];
      const waitTime = minuteWindow - (now - oldestRequest);
      
      logger.warn(`Salesforce minute rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    if (this.rateLimitQueue.length >= this.maxRequestsPerHour) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = hourWindow - (now - oldestRequest);
      
      logger.warn(`Salesforce hour rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.rateLimitQueue.push(now);
  }

  async getCases(filters = {}) {
    const query = this.buildSOQLQuery('Case', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.instanceUrl}/services/data/v58.0/query`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: { q: query }
    });

    return response.records.map(record => this.transformCase(record));
  }

  async createCase(caseData) {
    const transformedData = this.transformToSalesforce(caseData);
    
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.instanceUrl}/services/data/v58.0/sobjects/Case`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: transformedData
    });

    return this.getCase(response.id);
  }

  async updateCase(caseId, updateData) {
    const transformedData = this.transformToSalesforce(updateData);
    
    await this.makeRequest({
      method: 'PATCH',
      url: `${this.instanceUrl}/services/data/v58.0/sobjects/Case/${caseId}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      data: transformedData
    });

    return this.getCase(caseId);
  }

  async getLeads(filters = {}) {
    const query = this.buildSOQLQuery('Lead', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.instanceUrl}/services/data/v58.0/query`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: { q: query }
    });

    return response.records.map(record => this.transformLead(record));
  }

  async getOpportunities(filters = {}) {
    const query = this.buildSOQLQuery('Opportunity', filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.instanceUrl}/services/data/v58.0/query`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: { q: query }
    });

    return response.records.map(record => this.transformOpportunity(record));
  }

  async getCase(caseId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.instanceUrl}/services/data/v58.0/sobjects/Case/${caseId}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    return this.transformCase(response);
  }

  buildSOQLQuery(objectType, filters) {
    const fields = this.getObjectFields(objectType);
    let query = `SELECT ${fields.join(', ')} FROM ${objectType}`;
    
    const conditions = [];
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'offset' && value !== undefined) {
        if (typeof value === 'string') {
          conditions.push(`${key} LIKE '%${value}%'`);
        } else {
          conditions.push(`${key} = '${value}'`);
        }
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    if (filters.offset) {
      query += ` OFFSET ${filters.offset}`;
    }

    return query;
  }

  getObjectFields(objectType) {
    const fieldMappings = {
      Case: ['Id', 'CaseNumber', 'Subject', 'Description', 'Priority', 'Status', 'Type', 'Origin', 'Reason', 'OwnerId', 'CreatedById', 'CreatedDate', 'LastModifiedDate', 'ContactId', 'AccountId'],
      Lead: ['Id', 'FirstName', 'LastName', 'Company', 'Email', 'Phone', 'Status', 'LeadSource', 'Industry', 'Rating', 'CreatedDate', 'LastModifiedDate'],
      Opportunity: ['Id', 'Name', 'Amount', 'StageName', 'Type', 'CloseDate', 'Probability', 'Description', 'OwnerId', 'AccountId', 'CreatedDate', 'LastModifiedDate']
    };

    return fieldMappings[objectType] || ['Id', 'Name', 'CreatedDate', 'LastModifiedDate'];
  }

  transformCase(record) {
    return {
      id: record.Id,
      caseNumber: record.CaseNumber,
      subject: record.Subject,
      description: record.Description,
      priority: record.Priority,
      status: record.Status,
      type: record.Type,
      origin: record.Origin,
      reason: record.Reason,
      ownerId: record.OwnerId,
      createdById: record.CreatedById,
      createdAt: record.CreatedDate,
      updatedAt: record.LastModifiedDate,
      contactId: record.ContactId,
      accountId: record.AccountId
    };
  }

  transformLead(record) {
    return {
      id: record.Id,
      firstName: record.FirstName,
      lastName: record.LastName,
      company: record.Company,
      email: record.Email,
      phone: record.Phone,
      status: record.Status,
      leadSource: record.LeadSource,
      industry: record.Industry,
      rating: record.Rating,
      createdAt: record.CreatedDate,
      updatedAt: record.LastModifiedDate
    };
  }

  transformOpportunity(record) {
    return {
      id: record.Id,
      name: record.Name,
      amount: record.Amount,
      stageName: record.StageName,
      type: record.Type,
      closeDate: record.CloseDate,
      probability: record.Probability,
      description: record.Description,
      ownerId: record.OwnerId,
      accountId: record.AccountId,
      createdAt: record.CreatedDate,
      updatedAt: record.LastModifiedDate
    };
  }

  transformToSalesforce(data) {
    const transformed = {};
    
    const fieldMappings = {
      subject: 'Subject',
      description: 'Description',
      priority: 'Priority',
      status: 'Status',
      type: 'Type',
      origin: 'Origin',
      reason: 'Reason'
    };

    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = fieldMappings[key] || key;
      transformed[mappedKey] = value;
    });

    return transformed;
  }

  static getCapabilities() {
    return {
      platform: 'Salesforce',
      version: '1.0.0',
      features: [
        'case_management',
        'lead_management',
        'opportunity_management',
        'custom_objects',
        'field_mapping',
        'oauth_authentication',
        'rate_limiting',
        'retry_logic'
      ],
      objects: [
        'Case',
        'Lead',
        'Opportunity',
        'Account',
        'Contact',
        'Custom Objects'
      ],
      rateLimits: {
        requestsPerMinute: 150,
        requestsPerHour: 2000
      },
      authentication: 'oauth2',
      apiVersion: 'v58.0'
    };
  }

  static getRequiredConfig() {
    return [
      'clientId',
      'clientSecret',
      'username',
      'password'
    ];
  }
}

module.exports = SalesforceConnector; 