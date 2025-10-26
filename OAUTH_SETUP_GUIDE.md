# OAuth Setup Guide

## ⚠️ REQUIRED ENVIRONMENT VARIABLES

Add these to your Railway dashboard for OAuth to work:

### 1. OAUTH_STATE_SECRET (Required)
```
Variable: OAUTH_STATE_SECRET
Value: 81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd
```

### 2. APP_URL (Required)
```
Variable: APP_URL
Value: https://capable-motivation-production-7a75.up.railway.app
```

### 3. LINKEDIN_CLIENT_ID (Required for LinkedIn OAuth)
```
Variable: LINKEDIN_CLIENT_ID
Value: Get from LinkedIn Developers (see below)
```

### 4. LINKEDIN_CLIENT_SECRET (Required for LinkedIn OAuth)
```
Variable: LINKEDIN_CLIENT_SECRET
Value: Get from LinkedIn Developers (see below)
```

### 5. TWITTER_CLIENT_ID (Required for Twitter OAuth)
```
Variable: TWITTER_CLIENT_ID
Value: Get from Twitter Developer Portal (see below)
```

### 6. TWITTER_CLIENT_SECRET (Required for Twitter OAuth)
```
Variable: TWITTER_CLIENT_SECRET
Value: Get from Twitter Developer Portal (see below)
```

---

## 🔗 LINKEDIN OAUTH SETUP

### Step 1: Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/
2. Click "Create App"
3. Fill in:
   - App name: Social Media Automator
   - Company: Your company name
   - App use: Business and community purposes
   - Website URL: https://capable-motivation-production-7a75.up.railway.app
   - Privacy Policy URL: (create a privacy policy page)
   - Logo: Upload your logo
   - User Agreement: (create a user agreement page)

4. Click "Create App"

### Step 2: Configure Products

1. In the "Products" tab, select:
   - ✅ Sign In with LinkedIn using OpenID Connect
   
2. Click "Update" to save

### Step 3: Configure Redirect URLs

1. Go to "Auth" tab
2. In "Authorized redirect URLs for your app", add:
   ```
   https://capable-motivation-production-7a75.up.railway.app/auth/linkedin/callback
   ```

3. Click "Update" to save

### Step 4: Get Credentials

1. In the "Auth" tab, you'll see:
   - Client ID → Copy this to Railway as `LINKEDIN_CLIENT_ID`
   - Client Secret → Copy this to Railway as `LINKEDIN_CLIENT_SECRET`

### Step 5: Add to Railway

```
Variable: LINKEDIN_CLIENT_ID
Value: (paste your Client ID here)

Variable: LINKEDIN_CLIENT_SECRET
Value: (paste your Client Secret here)
```

---

## 🐦 TWITTER OAUTH SETUP

### Step 1: Create Twitter Developer App

1. Go to https://developer.twitter.com/en/portal
2. Click "Create Project" or use an existing project
3. Name your app: Social Media Automator
4. Add a description

### Step 2: Configure OAuth 2.0

1. In your project, go to "App Settings" → "User authentication settings"
2. Click "Set up" or "Edit"
3. Configure:
   - App permissions: Read and write
   - Type of App: Web App
   - Callback URI / Redirect URL:
     ```
     https://capable-motivation-production-7a75.up.railway.app/auth/twitter/callback
     ```
   - Website URL: 
     ```
     https://capable-motivation-production-7a75.up.railway.app
     ```

4. Click "Save"

### Step 3: Get Credentials

1. Go to "Keys and Tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret":
   - Client ID → Copy this to Railway as `TWITTER_CLIENT_ID`
   - Client Secret → Copy this to Railway as `TWITTER_CLIENT_SECRET`

### Step 4: Add to Railway

```
Variable: TWITTER_CLIENT_ID
Value: (paste your Client ID here)

Variable: TWITTER_CLIENT_SECRET
Value: (paste your Client Secret here)
```

---

## 📋 COMPLETE VARIABLE CHECKLIST

Add these to Railway in this order:

- [ ] `OAUTH_STATE_SECRET` → `81e83078e15ae349e50e28f617cb34acca527d9d4152a6da1dfe0fc98117a4bd`
- [ ] `APP_URL` → `https://capable-motivation-production-7a75.up.railway.app`
- [ ] `LINKEDIN_CLIENT_ID` → (from LinkedIn Developers)
- [ ] `LINKEDIN_CLIENT_SECRET` → (from LinkedIn Developers)
- [ ] `TWITTER_CLIENT_ID` → (from Twitter Developer Portal)
- [ ] `TWITTER_CLIENT_SECRET` → (from Twitter Developer Portal)

---

## ✅ TESTING AFTER SETUP

1. After adding all variables, Railway will auto-redeploy
2. Go to your dashboard: https://capable-motivation-production-7a75.up.railway.app/dashboard
3. Click "Connect LinkedIn" button
4. You should be redirected to LinkedIn OAuth page
5. Authorize the app
6. You should be redirected back with success message
7. Repeat for Twitter

---

## 🐛 TROUBLESHOOTING

### "LinkedIn OAuth not configured"
- Make sure `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are set in Railway
- Make sure callback URL is added in LinkedIn app settings

### "Twitter OAuth not configured"  
- Make sure `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are set in Railway
- Make sure callback URL is added in Twitter app settings

### "State expired" or "Invalid state"
- Make sure `OAUTH_STATE_SECRET` is set in Railway
- Redeploy after adding the secret

### Redirect mismatch errors
- Check that callback URLs match exactly in both:
  1. Railway `APP_URL` variable
  2. LinkedIn/Twitter app redirect URL settings

---

## 🔐 SECURITY NOTES

- Never commit OAuth secrets to git
- Keep your Client Secrets secure
- Use different credentials for production and development
- Rotate secrets periodically
- The `OAUTH_STATE_SECRET` should be unique and kept secret
