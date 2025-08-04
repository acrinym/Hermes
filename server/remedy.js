const defaultFetch = (...args) => fetch(...args);

class RemedyClient {
  constructor ({ baseUrl, username, password, fetch: customFetch } = {}) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.fetch = customFetch || defaultFetch;
    this.token = null;
  }

  async login () {
    const res = await this.fetch(`${this.baseUrl}/api/jwt/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password })
    });
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status}`);
    }
    this.token = await res.text();
    return this.token;
  }

  async createIncident (fields) {
    if (!this.token) {
      await this.login();
    }
    const res = await this.fetch(`${this.baseUrl}/api/arsys/v1/entry/HPD:IncidentInterface_Create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AR-JWT ${this.token}`
      },
      body: JSON.stringify({ values: fields })
    });
    if (!res.ok) {
      throw new Error(`Create incident failed: ${res.status}`);
    }
    return res.json();
  }
}

module.exports = RemedyClient;
