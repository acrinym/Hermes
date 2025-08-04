# 🔗 Hermes Backend Setup Guide

This guide explains how to connect the Hermes Chrome Extension to the enterprise backend located in `/Hermes/Recreated/`.

## 📋 Prerequisites

1. **Backend Server Running**: The Recreated backend must be running on your local machine or a remote server
2. **Chrome Extension Installed**: Hermes extension must be installed and active
3. **Network Access**: Extension must be able to reach the backend server

## 🚀 Quick Setup

### 1. Start the Backend Server

Navigate to the Recreated folder and start the backend:

```bash
cd /Hermes/Recreated/
npm install
npm start
```

The backend will start on `http://localhost:3000` by default.

### 2. Configure the Extension

1. **Open Hermes Extension**: Click the Hermes icon in your Chrome toolbar
2. **Click BACKEND Button**: This will auto-detect and configure the backend connection
3. **Check Console**: Open Chrome DevTools (F12) and check the console for connection status

### 3. Verify Connection

Look for these messages in the console:
- ✅ `Backend configured successfully`
- 🔗 `Backend connection status: Connected`

## ⚙️ Manual Configuration

If auto-detection fails, you can manually configure the backend:

### Using the Extension

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Run this command:

```javascript
// Configure for local development
import('./backendSetup.ts').then(m => m.setupEnvironment('local'));

// Or configure custom URL
import('./backendSetup.ts').then(m => m.setupBackend({
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3
}));
```

### Using Chrome Storage

You can also directly edit the backend configuration in Chrome storage:

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Navigate to Storage → Local Storage → chrome-extension://[your-extension-id]
4. Find `hermes_backend_config` and edit the value:

```json
{
  "baseUrl": "http://localhost:3000",
  "apiVersion": "v1",
  "endpoints": {
    "configs": "/api/v1/configs",
    "connectors": "/api/v1/connectors",
    "sync": "/api/v1/sync",
    "discovery": "/api/v1/discovery",
    "auth": "/api/v1/auth"
  },
  "timeout": 10000,
  "retries": 3
}
```

## 🌍 Environment Configurations

The extension supports different environments:

### Local Development
```javascript
import('./backendSetup.ts').then(m => m.setupEnvironment('local'));
// Backend URL: http://localhost:3000
```

### Development Server
```javascript
import('./backendSetup.ts').then(m => m.setupEnvironment('development'));
// Backend URL: http://localhost:3001
```

### Staging
```javascript
import('./backendSetup.ts').then(m => m.setupEnvironment('staging'));
// Backend URL: https://staging.hermes-backend.com
```

### Production
```javascript
import('./backendSetup.ts').then(m => m.setupEnvironment('production'));
// Backend URL: https://api.hermes-backend.com
```

## 🔧 Troubleshooting

### Connection Issues

1. **Check Backend Status**:
```javascript
import('./backendSetup.ts').then(m => m.getBackendStatus().then(status => {
  console.log('Backend Status:', status);
}));
```

2. **Test Connection**:
```javascript
import('./backendSetup.ts').then(m => m.testBackendConnection().then(result => {
  console.log('Connection Test:', result);
}));
```

3. **Auto-detect Backend**:
```javascript
import('./backendSetup.ts').then(m => m.autoDetectBackend().then(url => {
  console.log('Detected Backend:', url);
}));
```

### Common Problems

| Problem | Solution |
|---------|----------|
| Backend not detected | Ensure backend is running on port 3000, 3001, 8080, 8000, or 5000 |
| Connection timeout | Increase timeout in configuration or check network |
| CORS errors | Ensure backend has proper CORS headers configured |
| Authentication failed | Check if backend requires authentication tokens |

### Reset Configuration

To reset to default settings:

```javascript
import('./backendSetup.ts').then(m => m.resetBackendConfig());
```

## 📡 API Endpoints

The extension connects to these backend endpoints:

- **Configs**: `/api/v1/configs` - Platform configurations
- **Connectors**: `/api/v1/connectors` - Enterprise platform connectors
- **Sync**: `/api/v1/sync` - GitHub synchronization
- **Discovery**: `/api/v1/discovery` - Config discovery sessions
- **Auth**: `/api/v1/auth` - Authentication

## 🧩 Connector Examples

Below are minimal cURL samples from official vendor docs to verify connector access:

### Salesforce

```bash
# OAuth token request
curl https://login.salesforce.com/services/oauth2/token \
  -d 'grant_type=password' \
  -d 'client_id=YOUR_CLIENT_ID' \
  -d 'client_secret=YOUR_CLIENT_SECRET' \
  -d 'username=YOUR_USERNAME' \
  -d 'password=YOUR_PASSWORD'

# Query an account record
curl https://yourInstance.salesforce.com/services/data/v57.0/sobjects/Account/001D000000IqhSL \
  -H 'Authorization: Bearer <access_token>'
```

### BMC Helix

```bash
# Retrieve JWT token
curl -X POST https://helix.example.com/api/jwt/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"secret"}'

# Create an incident
curl -X POST https://helix.example.com/api/arsys/v1/entry/HPD:IncidentInterface_Create \
  -H 'Authorization: AR-JWT <token>' \
  -H 'Content-Type: application/json' \
  -d '{"values":{"Description":"Network outage","Impact":"2-Moderate"}}'
```

### BMC Remedy

```bash
# Login
curl -X POST http://remedy.example.com/api/jwt/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"Demo","password":"secret"}'

# Create an incident
curl -X POST http://remedy.example.com/api/arsys/v1/entry/HPD:IncidentInterface_Create \
  -H 'Authorization: AR-JWT <token>' \
  -H 'Content-Type: application/json' \
  -d '{"values":{"Description":"Printer jam","Urgency":"4-Low"}}'
```

Adjust URLs and payloads to match your instance.

## 🔐 GitHub Environment Variables

Set these variables before building or running the extension:

- `GITHUB_RAW_BASE`: Base URL for raw content (default `https://raw.githubusercontent.com`)
- `GITHUB_API_BASE`: REST API base URL (default `https://api.github.com`)
- `GITHUB_TOKEN`: Personal access token for authenticated requests. **Never store tokens in Chrome storage—use environment variables or your OS keychain instead.**

## 🔒 Security

- **Local Development**: Uses HTTP for localhost connections
- **Production**: Always use HTTPS for remote connections
- **Authentication**: Backend supports Bearer token authentication
- **CORS**: Backend must allow requests from the extension origin
- **Token Safety**: Avoid persisting access tokens in Chrome storage

## 📝 Configuration Validation

The extension validates backend configuration:

```javascript
import('./backendSetup.ts').then(m => {
  const config = {
    baseUrl: 'http://localhost:3000',
    apiVersion: 'v1',
    timeout: 10000,
    retries: 3
  };
  
  const validation = m.validateBackendConfig(config);
  console.log('Valid:', validation.valid);
  console.log('Errors:', validation.errors);
});
```

## 🎯 Next Steps

Once connected, you can:

1. **Test Enterprise Connectors**: Use the config discovery to test ServiceNow, Remedy, etc.
2. **Upload Configurations**: Automatically upload discovered configs to the backend
3. **Sync with GitHub**: Migrate configs from private repos to enterprise storage
4. **Use Work Notes**: Test the enhanced BMC Remedy work notes functionality

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify the backend server is running and accessible
3. Test the backend health endpoint: `http://localhost:3000/health`
4. Check network connectivity and firewall settings

---

**Happy Automating! 🚀** 