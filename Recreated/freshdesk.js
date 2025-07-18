/**
 * Freshdesk Connector
 * 
 * Provides enterprise integration with Freshdesk platform:
 * - REST API v2 integration
 * - API key authentication
 * - Tickets, Contacts, Companies management
 * - Field mapping and data transformation
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class FreshdeskConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    
    // Freshdesk specific rate limits
    this.rateLimitQueue = [];
    this.maxRequestsPerMinute = 1000;
    this.maxRequestsPerHour = 10000;
  }

  validateConfig(config) {
    const required = ['baseUrl', 'apiKey'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Freshdesk config: ${missing.join(', ')}`);
    }

    return true;
  }

  async authenticate() {
    try {
      // API key authentication - test with a simple request
      await this.makeRequest({
        method: 'GET',
        url: `${this.baseUrl}/api/v2/tickets`,
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
          'Accept': 'application/json'
        },
        params: { per_page: 1 }
      });

      this.authenticated = true;
      logger.info('Freshdesk authentication successful', {
        baseUrl: this.baseUrl
      });

      return true;

    } catch (error) {
      logger.error('Freshdesk authentication failed:', error);
      throw new Error(`Freshdesk authentication failed: ${error.message}`);
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
      
      logger.warn(`Freshdesk minute rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    if (this.rateLimitQueue.length >= this.maxRequestsPerHour) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = hourWindow - (now - oldestRequest);
      
      logger.warn(`Freshdesk hour rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.rateLimitQueue.push(now);
  }

  async getTickets(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/tickets`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Accept': 'application/json'
      },
      params: {
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
        ...filters
      }
    });

    return response.map(ticket => this.transformTicket(ticket));
  }

  async createTicket(ticketData) {
    const transformedData = this.transformToFreshdesk(ticketData);
    
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.baseUrl}/api/v2/tickets`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: transformedData
    });

    return this.transformTicket(response);
  }

  async updateTicket(ticketId, updateData) {
    const transformedData = this.transformToFreshdesk(updateData);
    
    const response = await this.makeRequest({
      method: 'PUT',
      url: `${this.baseUrl}/api/v2/tickets/${ticketId}`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: transformedData
    });

    return this.transformTicket(response);
  }

  async getContacts(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/contacts`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Accept': 'application/json'
      },
      params: {
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
        ...filters
      }
    });

    return response.map(contact => this.transformContact(contact));
  }

  async getCompanies(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/companies`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Accept': 'application/json'
      },
      params: {
        per_page: filters.limit || 100,
        page: Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1,
        ...filters
      }
    });

    return response.map(company => this.transformCompany(company));
  }

  async getTicket(ticketId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/api/v2/tickets/${ticketId}`,
      headers: {
        'Authorization': `Basic ${Buffer.from(this.apiKey + ':X').toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    return this.transformTicket(response);
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
      responderId: ticket.responder_id,
      companyId: ticket.company_id,
      tags: ticket.tags || [],
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      dueBy: ticket.due_by,
      frDueBy: ticket.fr_due_by,
      isEscalated: ticket.is_escalated,
      customFields: ticket.custom_fields || {}
    };
  }

  transformContact(contact) {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      companyId: contact.company_id,
      active: contact.active,
      address: contact.address,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
      lastLoginAt: contact.last_login_at,
      customFields: contact.custom_fields || {}
    };
  }

  transformCompany(company) {
    return {
      id: company.id,
      name: company.name,
      description: company.description,
      domains: company.domains || [],
      note: company.note,
      healthScore: company.health_score,
      accountTier: company.account_tier,
      renewalDate: company.renewal_date,
      industry: company.industry,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      customFields: company.custom_fields || {}
    };
  }

  transformToFreshdesk(data) {
    const transformed = {};
    
    const fieldMappings = {
      subject: 'subject',
      description: 'description',
      priority: 'priority',
      status: 'status',
      type: 'type',
      requesterId: 'requester_id',
      responderId: 'responder_id',
      companyId: 'company_id',
      tags: 'tags',
      dueBy: 'due_by',
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
      platform: 'Freshdesk',
      version: '1.0.0',
      features: [
        'ticket_management',
        'contact_management',
        'company_management',
        'field_mapping',
        'api_key_authentication',
        'rate_limiting',
        'retry_logic'
      ],
      objects: [
        'Ticket',
        'Contact',
        'Company',
        'Agent',
        'Group',
        'Custom Field'
      ],
      rateLimits: {
        requestsPerMinute: 1000,
        requestsPerHour: 10000
      },
      authentication: 'api_key',
      apiVersion: 'v2'
    };
  }

  static getRequiredConfig() {
    return [
      'baseUrl',
      'apiKey'
    ];
  }
}

module.exports = FreshdeskConnector; 