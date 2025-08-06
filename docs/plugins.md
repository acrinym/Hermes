# Hermes Plugins

Extend Hermes with custom data sources or visuals.

## Data Source Management

Use backend configuration to control SaaS data sources. Connectors are stored under the `saas` key of `hermes_backend_config`.

1. Open the extension Options page.
2. Enter a new connector name and configure its fields.
3. Save to store the configuration in `chrome.storage`.
4. The extension reloads connector mappings immediately.

See [`sample-connector.json`](./sample-connector.json) for the JSON structure.

To remove a connector, use the **Remove** button next to the entry and save. Mappings update at runtime. Default connectors are listed in [`default-connectors.json`](./default-connectors.json).

## Hosting Plugin Manifests and Skins

Serve plugin manifests or skins from GitHub Pages or Netlify so Hermes can fetch them easily.

### GitHub Pages
1. Place manifest or skin files in a public repo.
2. Under **Settings > Pages**, choose the branch and folder to publish.
3. Access files at `https://<user>.github.io/<repo>/<file>`.

### Netlify
1. Create a new site from your repository.
2. Set the publish directory to the folder with manifest/skin files.
3. Deploy and use the generated URL to reference your assets.

Both services require public access for Hermes to load the assets. ✅

## Serverless Setup

Use Firebase or Supabase to power Hermes without managing your own servers.

### Firebase Example
```js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID'
};

const app = initializeApp(firebaseConfig);
```

### Supabase Example
```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseKey = 'PUBLIC_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);
```

Store sensitive keys in environment variables when deploying. ✅
