/**
 * Jira Connector
 * 
 * Provides enterprise integration with Jira platform:
 * - REST API v3 integration
 * - OAuth 2.0 authentication
 * - Issues, Projects, Workflows management
 * - Field mapping and data transformation
 */

const BaseConnector = require('./base-connector');
const { logger } = require('../utils/logger');

class JiraConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Jira specific rate limits
    this.rateLimitQueue = [];
    this.maxRequestsPerMinute = 100;
    this.maxRequestsPerHour = 1000;
  }

  validateConfig(config) {
    const required = ['baseUrl', 'clientId', 'clientSecret'];
    const missing = required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required Jira config: ${missing.join(', ')}`);
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
      const tokenResponse = await this.client.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = tokenResponse.data.access_token;
      this.refreshToken = tokenResponse.data.refresh_token;
      this.tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
      this.authenticated = true;

      logger.info('Jira authentication successful', {
        baseUrl: this.baseUrl,
        expiresIn: tokenResponse.data.expires_in
      });

      return true;

    } catch (error) {
      logger.error('Jira authentication failed:', error);
      throw new Error(`Jira authentication failed: ${error.message}`);
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
      
      logger.warn(`Jira minute rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    if (this.rateLimitQueue.length >= this.maxRequestsPerHour) {
      const oldestRequest = this.rateLimitQueue[0];
      const waitTime = hourWindow - (now - oldestRequest);
      
      logger.warn(`Jira hour rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.rateLimitQueue.push(now);
  }

  async getIssues(filters = {}) {
    const jql = this.buildJQL(filters);
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/rest/api/3/search`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        jql: jql,
        maxResults: filters.limit || 100,
        startAt: filters.offset || 0,
        fields: 'summary,description,priority,status,assignee,reporter,created,updated,project,issuetype,components,labels'
      }
    });

    return response.issues.map(issue => this.transformIssue(issue));
  }

  async createIssue(issueData) {
    const transformedData = this.transformToJira(issueData);
    
    const response = await this.makeRequest({
      method: 'POST',
      url: `${this.baseUrl}/rest/api/3/issue`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: transformedData
    });

    return this.getIssue(response.id);
  }

  async updateIssue(issueId, updateData) {
    const transformedData = this.transformToJira(updateData);
    
    await this.makeRequest({
      method: 'PUT',
      url: `${this.baseUrl}/rest/api/3/issue/${issueId}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      data: transformedData
    });

    return this.getIssue(issueId);
  }

  async getProjects(filters = {}) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/rest/api/3/project`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        maxResults: filters.limit || 100,
        startAt: filters.offset || 0
      }
    });

    return response.values.map(project => this.transformProject(project));
  }

  async getIssue(issueId) {
    const response = await this.makeRequest({
      method: 'GET',
      url: `${this.baseUrl}/rest/api/3/issue/${issueId}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    return this.transformIssue(response);
  }

  buildJQL(filters) {
    const conditions = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'limit' && key !== 'offset' && value !== undefined) {
        if (typeof value === 'string') {
          conditions.push(`${key} ~ "${value}"`);
        } else {
          conditions.push(`${key} = "${value}"`);
        }
      }
    });

    return conditions.length > 0 ? conditions.join(' AND ') : 'ORDER BY created DESC';
  }

  transformIssue(issue) {
    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      priority: issue.fields.priority?.name,
      status: issue.fields.status?.name,
      type: issue.fields.issuetype?.name,
      assignee: issue.fields.assignee?.displayName,
      reporter: issue.fields.reporter?.displayName,
      project: issue.fields.project?.name,
      components: issue.fields.components?.map(c => c.name) || [],
      labels: issue.fields.labels || [],
      createdAt: issue.fields.created,
      updatedAt: issue.fields.updated,
      resolution: issue.fields.resolution?.name
    };
  }

  transformProject(project) {
    return {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      lead: project.lead?.displayName,
      category: project.projectCategory?.name,
      type: project.projectTypeKey,
      simplified: project.simplified,
      style: project.style,
      isPrivate: project.isPrivate
    };
  }

  transformToJira(data) {
    const transformed = {
      fields: {}
    };
    
    const fieldMappings = {
      summary: 'summary',
      description: 'description',
      priority: 'priority',
      status: 'status',
      type: 'issuetype',
      assignee: 'assignee',
      project: 'project',
      components: 'components',
      labels: 'labels'
    };

    Object.entries(data).forEach(([key, value]) => {
      const mappedKey = fieldMappings[key];
      if (mappedKey) {
        if (mappedKey === 'priority' || mappedKey === 'status' || mappedKey === 'issuetype') {
          transformed.fields[mappedKey] = { name: value };
        } else if (mappedKey === 'assignee') {
          transformed.fields[mappedKey] = { name: value };
        } else if (mappedKey === 'project') {
          transformed.fields[mappedKey] = { key: value };
        } else if (mappedKey === 'components') {
          transformed.fields[mappedKey] = value.map(name => ({ name }));
        } else {
          transformed.fields[mappedKey] = value;
        }
      }
    });

    return transformed;
  }

  static getCapabilities() {
    return {
      platform: 'Jira',
      version: '1.0.0',
      features: [
        'issue_management',
        'project_management',
        'workflow_management',
        'field_mapping',
        'oauth_authentication',
        'rate_limiting',
        'retry_logic'
      ],
      objects: [
        'Issue',
        'Project',
        'Workflow',
        'User',
        'Component',
        'Version'
      ],
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 1000
      },
      authentication: 'oauth2',
      apiVersion: 'v3'
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

module.exports = JiraConnector; 