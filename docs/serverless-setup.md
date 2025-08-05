# Serverless Setup

Use Firebase or Supabase to power Hermes without managing your own servers. 🚀

## Firebase Example
```js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID'
};

const app = initializeApp(firebaseConfig);
```

## Supabase Example
```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseKey = 'PUBLIC_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);
```

Store sensitive keys in environment variables when deploying. ✅
