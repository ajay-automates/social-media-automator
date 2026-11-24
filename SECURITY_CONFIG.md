# Security Configuration Guide

## Supabase Credentials

This project requires Supabase credentials to be set via environment variables.
**NEVER hardcode credentials in source code.**

### Required Environment Variables

| Variable | Description | Where to Set |
|----------|-------------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Railway / hosting platform |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Railway / hosting platform |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) | Railway / hosting platform |
| `ANTHROPIC_API_KEY` | Claude API key | Railway / hosting platform |
| `VITE_SUPABASE_URL` | Supabase URL for Vite dashboard | Railway / hosting platform |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key for Vite dashboard | Railway / hosting platform |

### How auth.html Gets Credentials

The `auth.html` file expects credentials to be injected at runtime via `window.__SUPABASE_CONFIG__`.

Add this to your `server.js` before serving `auth.html`:

```javascript
// In your Express server, inject config into auth.html
app.get('/auth', (req, res) => {
  let html = fs.readFileSync('./auth.html', 'utf8');
  const configScript = `<script>window.__SUPABASE_CONFIG__ = { url: '${process.env.SUPABASE_URL}', key: '${process.env.SUPABASE_ANON_KEY}' };</script>`;
  html = html.replace('</head>', configScript + '\n</head>');
  res.send(html);
});
```

### Rotating Compromised Keys

If your keys were previously exposed in git history:

1. Go to your Supabase dashboard > Settings > API
2. Regenerate the `anon` key
3. Update all environment variables on Railway
4. Redeploy your application
5. Use BFG Repo-Cleaner to purge secrets from git history:
   ```bash
   # Install BFG
   brew install bfg
   
   # Clone a fresh copy
   git clone --mirror git@github.com:ajay-automates/social-media-automator.git
   
   # Remove secrets from history
   bfg --replace-text passwords.txt social-media-automator.git
   
   # Push cleaned history
   cd social-media-automator.git
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push
   ```
