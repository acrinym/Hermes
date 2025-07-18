/**
 * Zendesk Connector
 * 
 * Provides enterprise integration with Zendesk platform:
 * - REST API v2 integration
 * - OAuth 2.0 authentication
 * - Tickets, Users, Organizations management
 * - Field mapping and data transformation
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class ZendeskConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Zendesk specific rate limits
    this.rateLimitQueue = [];
    this.maxRequestsPerMinute = 700;
    this.maxRequestsPerHour = 10000;
  }

  validateConfig(config) {
    const required = ['baseUrl', 'clientId', 'clientSecret'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Zendesk config: ${missing.join(', ')}`);
    }

    return true;
  }

  async authenticate() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        this.authenticated = true;
        return true;
      }

      // OAuth 2.0 token request
      const tokenResponse = await this.client.post(`${this.baseUrl}/oauth/tokens`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'read write'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = tokenResponse.data.access_token;
      this.refreshToken = tokenResponse.data.refresh_token;
      this.tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
      this.authenticated = true;

      logger.info('Zendesk authentication successful', {
        baseUrl: this.baseUrl,
        expiresIn: tokenResponse.data.expires_in
      });

      return true;

    } catch (error) {
      logger.error('Zendesk authentication failed:', error);
      throw new Error(`Zendesk authentication failed: ${error.message}`);
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
      
      logger.warn(`Zendesk minute rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    if (this.rateLimitQueue.length >= this.maxRequestsPerHour) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = hourWindow - (now - oldestRequest);
      
      logger.warn(`Zendesk hour rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.rateLimitQueue.push(now);
  }

  async getTickets(filters = {}) {
    const query = this.buildQuery(filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/search.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        query: query,
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1
      }
    });

    return response.results.map(ticket => this.transformTicket(ticket));
  }

  async createTicket(ticketData) {
    const transformedData = this.transformToZendesk(ticketData);
    
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.baseUrl}/api/v2/tickets.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { ticket: transformedData }
    });

    return this.transformTicket(response.ticket);
  }

  async updateTicket(ticketId, updateData) {
    const transformedData = this.transformToZendesk(updateData);
    
    const response = await this.makeRequest({
      method: 'PUT',
      url: `${this.baseUrl}/api/v2/tickets/${ticketId}.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { ticket: transformedData }
    });

    return this.transformTicket(response.ticket);
  }

  async getUsers(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/users.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1
      }
    });

    return response.users.map(user => this.transformUser(user));
  }

  async getOrganizations(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/organizations.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1
      }
    });

    return response.organizations.map(org => this.transformOrganization(org));
  }

  async getTicket(ticketId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/tickets/${ticketId}.json`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    return this.transformTicket(response.ticket);
  }

  buildQuery(filters) {
    const conditions = ['type:ticket'];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'offset' && value !== undefined) {
        if (typeof value === 'string') {
          conditions.push(`${key}:${value}`);
        } else {
          conditions.push(`${key}:${value}`);
        }
      }
    });

    return conditions.join(' ');
  }

  transformTicket(ticket) {
    return {
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      type: ticket.type,
      requesterId: ticket.requester_id,
      assigneeId: ticket.assignee_id,
      organizationId: ticket.organization_id,
      tags: ticket.tags || [],
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      dueAt: ticket.due_at,
      satisfactionRating: ticket.satisfaction_rating,
      customFields: ticket.custom_fields || []
    };
  }

  transformUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      active: user.active,
      verified: user.verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login_at
    };
  }

  transformOrganization(org) {
    return {
      id: org.id,
      name: org.name,
      domainNames: org.domain_names || [],
      details: org.details,
      notes: org.notes,
      tags: org.tags || [],
      externalId: org.external_id,
      createdAt: org.created_at,
      updatedAt: org.updated_at
    };
  }

  transformToZendesk(data) {
    const transformed = {};
    
    const fieldMappings = {
      subject: 'subject',
      description: 'description',
      priority: 'priority',
      status: 'status',
      type: 'type',
      requesterId: 'requester_id',
      assigneeId: 'assignee_id',
      organizationId: 'organization_id',
      tags: 'tags',
      dueAt: 'due_at',
      customFields: 'custom_fields'
    };

    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = fieldMappings[key];
      if (mappedKey) {
        transformed[mappedKey] = value;
      }
    });

    return transformed;
  }

  static getCapabilities() {
    return {
      platform: 'Zendesk',
      version: '1.0.0',
      features: [
        'ticket_management',
        'user_management',
        'organization_management',
        'field_mapping',
        'oauth_authentication',
        'rate_limiting',
        'retry_logic'
      ],
      objects: [
        'Ticket',
        'User',
        'Organization',
        'Group',
        'Brand',
        'Custom Field'
      ],
      rateLimits: {
        requestsPerMinute: 700,
        requestsPerHour: 10000
      },
      authentication: 'oauth2',
      apiVersion: 'v2'
    };
  }

  static getRequiredConfig() {
    return [
      'baseUrl',
      'clientId',
      'clientSecret'
    ];
  }
}

module.exports = ZendeskConnector; 