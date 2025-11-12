# Google OAuth Setup Guide

This document explains how to set up Google OAuth for user authentication in your Social Media Automator application.

## What's Implemented

The Google OAuth feature is now fully integrated into both the **Sign In** and **Sign Up** pages:

✅ **Sign In Page** (`/auth.html`)
- "Continue with Google" button prominently displayed at the top
- Users can log in directly with their Google account
- Email verification flow handled by Google

✅ **Sign Up Page** (`/auth.html`)
- "Sign up with Google" button prominently displayed at the top
- Users can create accounts using their Google account
- Automatic workspace creation upon first Google OAuth login

✅ **User Experience Improvements**
- Loading state feedback ("Connecting...")
- Error handling with clear messages
- Automatic redirect to dashboard after successful authentication
- Full integration with existing Supabase authentication system

## Prerequisites

1. Google Cloud Project
2. Supabase account (already configured)
3. OAuth 2.0 credentials from Google

## Step 1: Create Google OAuth 2.0 Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one
4. Give it a name like "Social Media Automator"

### 1.2 Enable Google+ API
1. In the search bar, search for "Google+ API"
2. Click on it and press **Enable**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **Credentials** (left sidebar)
2. Click **+ Create Credentials**
3. Select **OAuth client ID**
4. Choose **Web application**
5. Click **Create**

### 1.4 Configure OAuth Consent Screen
If you see the message "To create an OAuth client ID, you must first create an OAuth consent screen", follow these steps:

1. Click **Create OAuth consent screen**
2. Choose **External** (for users outside your organization)
3. Click **Create**
4. Fill in the form:
   - **App name**: Social Media Automator
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. On "Scopes" page, click **Save and Continue**
7. On "Summary" page, click **Back to Dashboard**

### 1.5 Add Authorized Redirect URIs
1. Go back to **Credentials**
2. Click the OAuth 2.0 client ID you just created
3. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:3000
   http://localhost:5173
   http://localhost:8080
   ```
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/auth/callback
   http://localhost:5173/auth/callback
   http://localhost:8080/auth/callback
   https://yourdomain.com/auth/callback
   https://gzchblilbthkfuxqhoyo.supabase.co/auth/v1/callback
   ```
5. Click **Save**

### 1.6 Get Your Client ID
1. On the OAuth client ID page, copy your **Client ID**
2. Keep this for Supabase configuration

## Step 2: Configure Supabase for Google OAuth

### 2.1 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (gzchblilbthkfuxqhoyo)

### 2.2 Enable Google Provider
1. Navigate to **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle it **ON**
4. Paste your Google **Client ID** from Step 1.6
5. Click **Save**

## Step 3: Update Environment Variables (Optional)

If you want to store Google credentials in your `.env` file:

```env
# Supabase (already configured)
SUPABASE_URL=https://gzchblilbthkfuxqhoyo.supabase.co
SUPABASE_ANON_KEY=your_existing_key

# Google OAuth (managed by Supabase, but you can reference Client ID here)
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
```

Note: The actual authentication is handled by Supabase, so you don't need to add these to your backend.

## Step 4: Test Google OAuth

### 4.1 Local Testing
1. Start your application: `npm run dev`
2. Navigate to `http://localhost:3000/auth.html`
3. Click the **"Continue with Google"** button
4. Sign in with your Google account
5. You should be redirected to the dashboard

### 4.2 Troubleshooting
If you see an error like "Redirect URI mismatch":
- Make sure the redirect URI in Google Cloud matches exactly
- Check that `https://gzchblilbthkfuxqhoyo.supabase.co/auth/v1/callback` is in your Google Cloud authorized URIs
- Clear browser cookies and try again

## Step 5: Production Deployment

### 5.1 Update Google OAuth URIs for Production
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Credentials** → Your OAuth 2.0 Client ID
3. Add your production domain:
   ```
   JavaScript origins:
   https://yourdomain.com

   Redirect URIs:
   https://yourdomain.com/auth/callback
   ```

### 5.2 Update Supabase Site URL
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **General**
3. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)

### 5.3 Deploy
1. Build your app: `npm run build`
2. Deploy to your hosting platform

## How Google OAuth Works in This App

### User Sign In/Sign Up Flow
```
User clicks "Continue with Google"
    ↓
Supabase redirects to Google login
    ↓
User authenticates with Google
    ↓
Google redirects back with authorization code
    ↓
Supabase exchanges code for user session
    ↓
User logged in and redirected to dashboard
    ↓
Automatic workspace creation (first-time users)
```

### Backend Integration
The authentication is handled entirely by Supabase OAuth. The backend (`server.js`) verifies tokens using the `verifyAuth` middleware:

```javascript
async function verifyAuth(req, res, next) {
  // Extract Bearer token from Authorization header
  const token = authHeader.substring(7);

  // Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = { id: user.id, email: user.email };
  next();
}
```

## Features Implemented

### For Sign In Users
- One-click login with Google
- No need to remember passwords
- Automatic email verification
- Secure session management

### For New Users (Sign Up)
- Create account with just one click
- No password required
- Automatic workspace creation
- Immediate dashboard access after Google authentication

### Security Features
- OAuth 2.0 standard protocol
- JWT tokens issued by Supabase
- Token validation on every API request
- Automatic token expiration and refresh
- No password storage required

## Current Button Status

Both the Sign In and Sign Up pages now display:

### Sign In Page
```
┌─────────────────────────────────────┐
│  Welcome Back                        │
├─────────────────────────────────────┤
│  [Google Logo] Continue with Google  │ ← Primary action
├─────────────────────────────────────┤
│            OR                        │
├─────────────────────────────────────┤
│  Email: [____________]               │
│  Password: [____________]            │
│  [Sign In with Email]               │
├─────────────────────────────────────┤
│  Forgot password?                    │
│  [GitHub]                           │
└─────────────────────────────────────┘
```

### Sign Up Page
```
┌─────────────────────────────────────┐
│  Create Account                      │
├─────────────────────────────────────┤
│  [Google Logo] Sign up with Google   │ ← Primary action
├─────────────────────────────────────┤
│            OR                        │
├─────────────────────────────────────┤
│  Email: [____________]               │
│  Password: [____________]            │
│  [Create Account with Email]        │
├─────────────────────────────────────┤
│  [GitHub]                           │
└─────────────────────────────────────┘
```

## Next Steps (Optional Enhancements)

1. **Verify Email on Google OAuth** - Automatically verify email after Google authentication
2. **Link Multiple Providers** - Allow users to link both Google and GitHub to their account
3. **Google Workspace Support** - Enable Google Workspace domain sign-in
4. **Custom Claims** - Add custom claims to JWT tokens for role-based access

## Support

If you encounter any issues:

1. Check browser console for errors (F12 → Console)
2. Verify Google OAuth Client ID is correctly set in Supabase
3. Ensure redirect URIs match exactly (including https)
4. Clear browser cookies and try again
5. Check Supabase Auth logs for more details

## Files Modified

- `auth.html` - Updated Sign In/Sign Up forms with prominent Google OAuth buttons, loading states, and improved error handling
- `GOOGLE_OAUTH_SETUP.md` - This setup guide (new file)

## Implementation Details

The implementation uses:
- **Supabase Auth SDK** - OAuth handling (`@supabase/supabase-js`)
- **Google OAuth 2.0** - Standard protocol for secure authentication
- **Custom Error Handling** - User-friendly error messages
- **Loading States** - Button feedback during authentication
- **Automatic Redirects** - Seamless user experience after login
