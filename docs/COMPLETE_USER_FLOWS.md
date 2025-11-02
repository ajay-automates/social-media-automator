# 🗺️ Complete User Flow Diagrams - Social Media Automator

This document explains every user flow in simple, everyday language with step-by-step diagrams.

---

## 📋 Table of Contents

1. [User Signs Up](#1-user-signs-up)
2. [User Logs In](#2-user-logs-in)
3. [User Connects Instagram Account](#3-user-connects-instagram-account)
4. [User Connects Twitter Account](#4-user-connects-twitter-account)
5. [User Connects LinkedIn Account](#5-user-connects-linkedin-account)
6. [User Connects Telegram Bot](#6-user-connects-telegram-bot)
7. [User Creates a Post Immediately](#7-user-creates-a-post-immediately)
8. [User Schedules a Post](#8-user-schedules-a-post)
9. [User Generates AI Caption](#9-user-generates-ai-caption)
10. [User Generates AI Image](#10-user-generates-ai-image)
11. [User Uploads Media](#11-user-uploads-media)
12. [User Views Analytics](#12-user-views-analytics)
13. [User Creates Template](#13-user-creates-template)
14. [User Upgrades Plan](#14-user-upgrades-plan)
15. [System Posts Scheduled Content](#15-system-posts-scheduled-content)

---

## 1. User Signs Up

### What Happens:
A new user creates an account to start using the platform.

### Flow Diagram:
```
👤 User                     🌐 Browser                  🔐 Supabase Auth
  │                            │                            │
  │ 1. Visit /auth            │                            │
  ├──────────────────────────>│                            │
  │                            │                            │
  │ 2. Enter email & password │                            │
  ├──────────────────────────>│                            │
  │                            │                            │
  │                            │ 3. Call signup API         │
  │                            ├───────────────────────────>│
  │                            │                            │
  │                            │                            │ 4. Create user
  │                            │                            │    Generate JWT
  │                            │                            │
  │                            │ 5. Return session + token  │
  │                            │<───────────────────────────┤
  │                            │                            │
  │                            │ 6. Save to localStorage    │
  │                            │                            │
  │ 7. Redirect to /dashboard │                            │
  │<───────────────────────────┤                            │
  │                            │                            │
  │ ✅ Signed up successfully! │                            │
```

### Step-by-Step Explanation:

1. **User visits the auth page**: They go to `http://localhost:3000/auth` and see the signup form
2. **User fills in details**: They enter their email (e.g., "john@example.com") and password
3. **User clicks "Sign Up"**: The form submits
4. **Frontend calls Supabase**: The React app uses `supabase.auth.signUp()` to create the account
5. **Supabase creates account**: A new user record is created in the database
6. **JWT token generated**: Supabase creates a secure authentication token
7. **Token saved**: The token is stored in the browser's localStorage
8. **User redirected**: They are automatically taken to the dashboard at `/dashboard`
9. **Done!**: User can now start using the app

### Code Reference:
- **Frontend**: `dashboard/src/contexts/AuthContext.jsx` (lines 13-28)
- **Backend**: Supabase handles authentication automatically

---

## 2. User Logs In

### What Happens:
An existing user logs back into their account.

### Flow Diagram:
```
👤 User                     🌐 Browser                  🔐 Supabase Auth
  │                            │                            │
  │ 1. Visit /auth            │                            │
  ├──────────────────────────>│                            │
  │                            │                            │
  │ 2. Enter credentials      │                            │
  ├──────────────────────────>│                            │
  │                            │                            │
  │                            │ 3. signInWithPassword()    │
  │                            ├───────────────────────────>│
  │                            │                            │
  │                            │                            │ 4. Verify password
  │                            │                            │    Get user data
  │                            │                            │
  │                            │ 5. Return session          │
  │                            │<───────────────────────────┤
  │                            │                            │
  │ 6. Redirect to dashboard  │                            │
  │<───────────────────────────┤                            │
  │                            │                            │
  │ ✅ Logged in!              │                            │
```

### Step-by-Step Explanation:

1. **User visits auth page**: Goes to `http://localhost:3000/auth`
2. **Enters email and password**: Types in their login credentials
3. **Clicks "Log In"**: Submit button pressed
4. **Frontend calls Supabase**: `supabase.auth.signInWithPassword()` is called
5. **Supabase verifies password**: Checks if the password matches the stored hash
6. **Session created**: If correct, a new session with JWT token is created
7. **Token saved to browser**: Stored in localStorage for future API calls
8. **Redirect to dashboard**: User is taken to `/dashboard`
9. **All API calls now authenticated**: Every request includes the JWT token automatically

### Code Reference:
- **Frontend**: `dashboard/src/contexts/AuthContext.jsx`
- **Backend**: Handled by Supabase Auth

---

## 3. User Connects Instagram Account

### What Happens:
User wants to post to Instagram, so they connect their Instagram Business account through Facebook.

### Flow Diagram:
```
👤 User          📱 Dashboard         🚂 Backend          📘 Facebook         🗄️ Database
  │                 │                    │                   │                  │
  │ 1. Click        │                    │                   │                  │
  │ "Connect        │                    │                   │                  │
  │ Instagram"      │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │                 │ 2. Request OAuth   │                   │                  │
  │                 │    URL             │                   │                  │
  │                 ├───────────────────>│                   │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 3. Generate URL   │                  │
  │                 │                    │    with state     │                  │
  │                 │                    │                   │                  │
  │                 │ 4. Return URL      │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 5. Open popup   │                    │                   │                  │
  │    with         │                    │                   │                  │
  │    Facebook     │                    │                   │                  │
  │    login        │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 6. Log in to    │                    │                   │                  │
  │    Facebook     │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 7. Grant        │                    │                   │                  │
  │    permissions  │                    │                   │                  │
  │    (Instagram   │                    │                   │                  │
  │    access)      │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │                   │ 8. Generate code │
  │                 │                    │                   │                  │
  │                 │                    │ 9. Redirect with  │                  │
  │                 │                    │    auth code      │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 10. Exchange code │                  │
  │                 │                    │     for tokens    │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 11. Return tokens │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 12. Get Instagram │                  │
  │                 │                    │     account info  │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 13. Return        │                  │
  │                 │                    │     Instagram     │                  │
  │                 │                    │     account       │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 14. Save to DB    │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │                    │                   │                  │ 15. Store:
  │                 │                    │                   │                  │     - Access token
  │                 │                    │                   │                  │     - Instagram ID
  │                 │                    │                   │                  │     - Username
  │                 │                    │                   │                  │
  │                 │ 16. Redirect back  │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 17. Show        │                    │                   │                  │
  │ "Instagram      │                    │                   │                  │
  │ Connected!"     │                    │                   │                  │
  │<────────────────┤                    │                   │                  │
  │                 │                    │                   │                  │
  │ ✅ Can now post │                    │                   │                  │
  │    to Instagram!│                    │                   │                  │
```

### Step-by-Step Explanation:

1. **User goes to Settings page**: Navigates to `/dashboard/settings`
2. **Clicks "Connect Instagram" button**: The blue button under social accounts
3. **Frontend requests OAuth URL**: Calls `POST /api/auth/instagram/url`
4. **Backend generates URL**: Creates Facebook OAuth URL with encrypted user ID
5. **Popup opens**: A new window shows Facebook login page
6. **User logs into Facebook**: Enters Facebook credentials
7. **Facebook asks for permissions**: "Allow app to access your Instagram Business account?"
8. **User clicks "Allow"**: Grants permissions
9. **Facebook redirects back**: Sends to `/auth/instagram/callback` with auth code
10. **Backend exchanges code for token**: Calls Facebook Graph API
11. **Backend gets Instagram account**: Uses token to fetch Instagram Business account details
12. **Backend saves to database**: Stores access token, Instagram ID, username in `user_accounts` table
13. **User redirected to Settings**: Popup closes, Settings page refreshes
14. **Success message shown**: "Instagram connected successfully!"
15. **Instagram now appears in connected accounts**: Green checkmark visible
16. **User can now post to Instagram**: Instagram option now available when creating posts

### Code Reference:
- **Frontend Button**: `dashboard/src/pages/Settings.jsx` (Instagram section)
- **OAuth URL Generation**: `server.js` (line 1668)
- **OAuth Callback**: `server.js` (line 1699)
- **Instagram Service**: `services/instagram.js`

---

## 4. User Connects Twitter Account

### What Happens:
User wants to post tweets, so they connect their Twitter/X account using OAuth 2.0 with PKCE.

### Flow Diagram:
```
👤 User          📱 Dashboard         🚂 Backend          🐦 Twitter         🗄️ Database
  │                 │                    │                   │                  │
  │ 1. Click        │                    │                   │                  │
  │ "Connect        │                    │                   │                  │
  │ Twitter"        │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │                 │ 2. GET /api/auth/  │                   │                  │
  │                 │    twitter/url     │                   │                  │
  │                 ├───────────────────>│                   │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 3. Generate PKCE  │                  │
  │                 │                    │    code_verifier  │                  │
  │                 │                    │    & challenge    │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 4. Store verifier │                  │
  │                 │                    │    temporarily    │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │ 5. Return OAuth    │                   │                  │
  │                 │    URL             │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 6. Redirect to  │                    │                   │                  │
  │    Twitter      │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 7. Login to     │                    │                   │                  │
  │    Twitter      │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 8. Authorize app│                    │                   │                  │
  │    permissions  │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 9. Callback with  │                  │
  │                 │                    │    code           │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 10. Get verifier  │                  │
  │                 │                    │     from storage  │                  │
  │                 │                    │<──────────────────────────────────────┤
  │                 │                    │                   │                  │
  │                 │                    │ 11. Exchange code │                  │
  │                 │                    │     + verifier    │                  │
  │                 │                    │     for token     │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 12. Return tokens │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 13. Get user info │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 14. Return profile│                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 15. Save to DB    │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │ 16. Show success│                    │                   │                  │
  │<────────────────┤                    │                   │                  │
  │                 │                    │                   │                  │
  │ ✅ Connected!   │                    │                   │                  │
```

### Step-by-Step Explanation:

1. **User in Settings page**: At `/dashboard/settings`
2. **Clicks "Connect Twitter" button**: Blue button in social accounts section
3. **Frontend makes API call**: `POST /api/auth/twitter/url` to get OAuth URL
4. **Backend generates PKCE codes**: Creates random `code_verifier` and `code_challenge` for security
5. **Backend stores verifier**: Saves it temporarily (10 minutes) in database
6. **Backend returns Twitter URL**: OAuth URL with challenge and state
7. **User redirected to Twitter**: Opens Twitter authorization page
8. **User logs into Twitter**: Enters Twitter username/password
9. **Twitter shows permissions**: "Allow app to post tweets and upload media?"
10. **User clicks "Authorize app"**: Grants permissions
11. **Twitter redirects back**: Sends to `/auth/twitter/callback` with auth code
12. **Backend retrieves verifier**: Gets stored `code_verifier` from database
13. **Backend exchanges code for token**: Sends code + verifier to Twitter API
14. **Twitter returns access token**: Plus refresh token for long-term access
15. **Backend gets user profile**: Calls Twitter API to get username and user ID
16. **Backend saves to database**: Stores tokens, username, user ID in `user_accounts` table
17. **User sees success message**: "Twitter connected!" toast notification
18. **Twitter now in connected accounts**: Shows @username with green checkmark
19. **User can post tweets**: Twitter checkbox now available in Create Post page

### Code Reference:
- **OAuth URL**: `server.js` (line 1355)
- **Callback Handler**: `server.js` (line 1438)
- **Twitter Service**: `services/twitter.js`

---

## 5. User Connects LinkedIn Account

### What Happens:
User connects their LinkedIn profile to post professional content.

### Step-by-Step Explanation:

1. **User clicks "Connect LinkedIn"** in Settings page
2. **Frontend requests OAuth URL** from backend (`POST /api/auth/linkedin/url`)
3. **Backend generates LinkedIn OAuth URL** with encrypted user ID in state parameter
4. **New window opens** with LinkedIn login page
5. **User logs into LinkedIn** with their credentials
6. **LinkedIn asks for permissions**: "Allow app to post on your behalf?"
7. **User clicks "Allow"**
8. **LinkedIn redirects back** to `/auth/linkedin/callback` with authorization code
9. **Backend exchanges code** for access token from LinkedIn API
10. **Backend gets user profile** (name, email, LinkedIn ID)
11. **Backend saves credentials** to database
12. **Window closes**, success notification shown
13. **LinkedIn connected!** User can now post to LinkedIn

### Code Reference:
- **OAuth URL**: `server.js` (line 1210)
- **Callback**: `server.js` (line 1257)
- **LinkedIn Service**: `services/linkedin.js`

---

## 6. User Connects Telegram Bot

### What Happens:
User connects a Telegram bot to post messages to their channel/group.

### Flow Diagram:
```
👤 User          📱 Dashboard         🚂 Backend          📱 Telegram        🗄️ Database
  │                 │                    │                   │                  │
  │ 1. Create bot   │                    │                   │                  │
  │    with         │                    │                   │                  │
  │    @BotFather   │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 2. Get bot token│                    │                   │                  │
  │<────────────────────────────────────────────────────────┤                  │
  │                 │                    │                   │                  │
  │ 3. Get chat ID  │                    │                   │                  │
  │    (send /start │                    │                   │                  │
  │    to bot)      │                    │                   │                  │
  ├────────────────────────────────────────────────────────>│                  │
  │                 │                    │                   │                  │
  │ 4. Click        │                    │                   │                  │
  │ "Connect        │                    │                   │                  │
  │ Telegram"       │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 5. Enter bot    │                    │                   │                  │
  │    token &      │                    │                   │                  │
  │    chat ID      │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │                 │ 6. Submit form     │                   │                  │
  │                 ├───────────────────>│                   │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 7. Validate token │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │ 8. Return bot info│                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 9. Save to DB     │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │ 10. Success!       │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 11. Show success│                    │                   │                  │
  │<────────────────┤                    │                   │                  │
  │                 │                    │                   │                  │
  │ ✅ Telegram     │                    │                   │                  │
  │    connected!   │                    │                   │                  │
```

### Step-by-Step Explanation:

1. **User creates Telegram bot**: 
   - Opens Telegram app
   - Searches for "@BotFather"
   - Sends `/newbot` command
   - Follows prompts to create bot
   - Receives bot token (e.g., `123456789:ABCdef...`)

2. **User gets chat ID**:
   - Sends `/start` to their bot
   - Or uses bot in a channel/group
   - Uses @userinfobot or similar to get chat ID

3. **User goes to Settings**: Navigates to `/dashboard/settings`

4. **Clicks "Connect Telegram"**: Opens modal/form

5. **Enters credentials**:
   - Bot Token: `123456789:ABCdef...`
   - Chat ID: `-1001234567890`

6. **Clicks "Connect"**: Form submits

7. **Backend validates token**: Calls `POST /api/auth/telegram/connect`

8. **Backend tests bot**: Makes test call to Telegram API with token

9. **If valid**: Gets bot username and details

10. **Backend saves to database**: Stores token and chat ID securely

11. **Success notification**: "Telegram bot connected!"

12. **Bot appears in list**: Shows bot name with green checkmark

13. **User can post to Telegram**: Telegram option now available

### Code Reference:
- **Connect Endpoint**: `server.js` (line 1921)
- **Telegram Service**: `services/telegram.js`

---

## 7. User Creates a Post Immediately

### What Happens:
User writes content and posts it immediately to selected social media platforms.

### Flow Diagram:
```
👤 User          📱 Create Post       🚂 Backend          🌐 Social APIs     🗄️ Database
  │                 │                    │                   │                  │
  │ 1. Click        │                    │                   │                  │
  │ "Create Post"   │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 2. Type caption │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 3. Select       │                    │                   │                  │
  │    platforms    │                    │                   │                  │
  │    ☑ Twitter    │                    │                   │                  │
  │    ☑ LinkedIn   │                    │                   │                  │
  │    ☐ Instagram  │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 4. Click        │                    │                   │                  │
  │ "Post Now"      │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │                 │ 5. API call        │                   │                  │
  │                 │    POST /api/post/ │                   │                  │
  │                 │    now             │                   │                  │
  │                 ├───────────────────>│                   │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 6. Verify JWT     │                  │
  │                 │                    │    Get user ID    │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 7. Check limits   │                  │
  │                 │                    │    (10/month free)│                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │                    │ 8. Get user's     │                  │
  │                 │                    │    credentials    │                  │
  │                 │                    │<──────────────────────────────────────┤
  │                 │                    │                   │                  │
  │                 │                    │ 9. Post to Twitter│                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │ Twitter API      │
  │                 │                    │ 10. ✅ Success    │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 11. Post LinkedIn │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │ LinkedIn API     │
  │                 │                    │ 12. ✅ Success    │                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 13. Save to DB    │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │                    │ 14. Increment     │                  │
  │                 │                    │     usage count   │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │ 15. Return results │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 16. Show success│                    │                   │                  │
  │     🎉 Confetti!│                    │                   │                  │
  │<────────────────┤                    │                   │                  │
  │                 │                    │                   │                  │
  │ ✅ Posted to 2  │                    │                   │                  │
  │    platforms!   │                    │                   │                  │
```

### Step-by-Step Explanation:

1. **User clicks "Create Post"** in top navigation
2. **Redirected to** `/dashboard/create`
3. **User types caption**: "Check out our new product! 🚀"
4. **User selects platforms**: Checks Twitter and LinkedIn boxes
5. **Optional: User uploads image** by clicking upload button
6. **User clicks "Post Now" button**: Blue button at bottom
7. **Frontend shows loading overlay**: "Posting to 2 platforms..."
8. **Frontend calls API**: `POST /api/post/now` with caption and platforms
9. **Backend receives request**: JWT token automatically included
10. **Backend verifies user**: Extracts user ID from JWT token
11. **Backend checks usage limits**: Free users get 10 posts/month
12. **If limit not reached**: Proceeds with posting
13. **Backend gets user's credentials**: Fetches Twitter and LinkedIn tokens from database
14. **Backend posts to Twitter**: 
    - Calls Twitter API
    - Creates tweet
    - Returns tweet ID and URL
15. **Backend posts to LinkedIn**:
    - Calls LinkedIn API  
    - Creates share
    - Returns share ID and URL
16. **Backend saves to database**: Records post in `posts` table
17. **Backend increments counter**: Usage count goes from 3 to 4
18. **Backend returns success**: Both platforms posted successfully
19. **Frontend shows celebration**: 
    - 🎉 Confetti animation
    - "Posted to 2 platforms successfully!"
    - Links to view posts on Twitter and LinkedIn
20. **User redirected**: Taken to Analytics page to see the new post

### Code Reference:
- **Frontend**: `dashboard/src/pages/CreatePost.jsx` (line 165)
- **Backend**: `server.js` (line 321)
- **Services**: `services/twitter.js`, `services/linkedin.js`

---

## 8. User Schedules a Post

### What Happens:
User writes content and schedules it to post at a future time.

### Step-by-Step Explanation:

1. **User in Create Post page**: Already typed caption
2. **User clicks "Schedule for Later"** tab
3. **Date/time picker appears**
4. **User selects date**: e.g., Tomorrow
5. **User selects time**: e.g., 10:00 AM
6. **User clicks "Schedule Post"** button
7. **Frontend calls**: `POST /api/post/schedule`
8. **Backend adds to queue**: Saves in `scheduled_posts` table
9. **Cron job running**: Checks queue every minute
10. **At scheduled time**: Cron job posts to platforms
11. **User sees success**: "Post scheduled for tomorrow 10:00 AM"
12. **Post appears in queue**: Visible in Analytics > Scheduled tab

### Code Reference:
- **Schedule Endpoint**: `server.js` (line 494)
- **Cron Scheduler**: `services/scheduler.js`

---

## 9. User Generates AI Caption

### What Happens:
User uses Claude AI to generate social media captions automatically.

### Flow Diagram:
```
👤 User          📱 Create Post       🚂 Backend          🤖 Claude AI       🗄️ Database
  │                 │                    │                   │                  │
  │ 1. Click "AI"   │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 2. Select niche │                    │                   │                  │
  │    "Technology" │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ 3. Click        │                    │                   │                  │
  │ "Generate"      │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │                 │ 4. API call        │                   │                  │
  │                 ├───────────────────>│                   │                  │
  │                 │                    │                   │                  │
  │                 │                    │ 5. Check AI limit │                  │
  │                 │                    │    (Pro: 100/mo)  │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │                    │ 6. Call Claude AI │                  │
  │                 │                    ├──────────────────>│                  │
  │                 │                    │                   │                  │
  │                 │                    │                   │ 7. Generate 3
  │                 │                    │                   │    variations
  │                 │                    │                   │                  │
  │                 │                    │ 8. Return captions│                  │
  │                 │                    │<──────────────────┤                  │
  │                 │                    │                   │                  │
  │                 │                    │ 9. Track usage    │                  │
  │                 │                    ├──────────────────────────────────────>│
  │                 │                    │                   │                  │
  │                 │ 10. Return 3       │                   │                  │
  │                 │     variations     │                   │                  │
  │                 │<───────────────────┤                   │                  │
  │                 │                    │                   │                  │
  │ 11. Show        │                    │                   │                  │
  │     variations  │                    │                   │                  │
  │<────────────────┤                    │                   │                  │
  │                 │                    │                   │                  │
  │ 12. Select one  │                    │                   │                  │
  ├────────────────>│                    │                   │                  │
  │                 │                    │                   │                  │
  │ ✅ Caption added│                    │                   │                  │
```

### Step-by-Step Explanation:

1. **User in Create Post page**
2. **Clicks "Generate with AI"** button (purple button)
3. **Modal opens** with AI generation form
4. **User selects niche**: Dropdown with options like "Technology", "Marketing", "Fitness"
5. **User clicks "Generate 3 Variations"**
6. **Shows loading**: "Generating captions with AI..."
7. **Frontend calls**: `POST /api/ai/generate`
8. **Backend checks limits**: Pro plan gets 100 AI generations/month
9. **Backend calls Claude AI**: Sends prompt with niche and platform
10. **Claude generates 3 variations**: Different writing styles and lengths
11. **Backend increments AI counter**: Usage goes from 45 to 46
12. **Frontend shows 3 options**:
    - Variation 1: Professional tone
    - Variation 2: Casual/fun tone  
    - Variation 3: Short and direct
13. **User clicks on preferred variation**
14. **Caption automatically fills** in the main text box
15. **Modal closes**
16. **User can edit further** or post directly

### Code Reference:
- **Frontend**: `dashboard/src/pages/CreatePost.jsx` (line 46)
- **Backend**: `server.js` (line 1033)
- **AI Service**: `services/ai.js`

---

## 10. User Generates AI Image

### What Happens:
User uses Stability AI to generate images for their posts.

### Step-by-Step Explanation:

1. **User clicks "Generate AI Image"** in Create Post
2. **Modal opens** with prompt input
3. **User types description**: "Modern office workspace with laptop"
4. **User selects style**: Photographic, Digital Art, etc.
5. **Clicks "Generate"**
6. **Loading shows**: "Creating your image..."
7. **Backend calls Stability AI**: With prompt and style
8. **AI generates image**: Takes 5-10 seconds
9. **Image appears** in preview
10. **User can**:
    - Click "Use This Image" to attach it
    - Click "Regenerate" to try again
    - Click "Cancel" to go back
11. **If used**: Image URL saved, appears in post preview
12. **User can now post** with AI-generated image

### Code Reference:
- **Frontend**: `dashboard/src/pages/CreatePost.jsx` (line 89)
- **Backend**: `server.js` (line 1145)
- **AI Image Service**: `services/ai-image.js`

---

## 11. User Uploads Media

### What Happens:
User uploads their own image or video to include in a post.

### Step-by-Step Explanation:

1. **User clicks "Upload Image/Video"** button
2. **File picker opens**
3. **User selects file** from computer (max 100MB)
4. **File validates**: Checks if image (jpg, png) or video (mp4, mov)
5. **Upload starts**: Progress bar shows 0%...50%...100%
6. **Frontend sends to backend**: `POST /api/upload/image` with file
7. **Backend receives file**: Saved temporarily in `uploads/` folder
8. **Backend uploads to Cloudinary**: Cloud storage service
9. **Cloudinary processes**: Optimizes and generates URL
10. **Backend returns URL**: `https://res.cloudinary.com/.../image.jpg`
11. **Temporary file deleted**: Cleaned from server
12. **Image preview shows**: Thumbnail visible in Create Post
13. **User can now post** with uploaded media

### Code Reference:
- **Frontend**: `dashboard/src/pages/CreatePost.jsx` (upload button)
- **Backend**: `server.js` (line 908)
- **Cloudinary Service**: `services/cloudinary.js`

---

## 12. User Views Analytics

### What Happens:
User checks their posting history and performance statistics.

### Step-by-Step Explanation:

1. **User clicks "Analytics"** in navigation
2. **Page loads**: `/dashboard/analytics`
3. **Frontend makes 3 API calls**:
   - `GET /api/analytics/overview` → Total stats
   - `GET /api/analytics/platforms` → Per-platform breakdown
   - `GET /api/analytics/timeline` → Daily activity chart
4. **Backend queries database**: Filters by user ID
5. **Returns data**:
   - Total posts: 42
   - Success rate: 95%
   - Most used platform: LinkedIn (18 posts)
6. **Frontend displays**:
   - Cards with stats
   - Bar chart by platform
   - Line chart over time
   - Recent posts list with links
7. **User can click post links**: Opens actual post on social platform
8. **Auto-refreshes**: Every 30 seconds to show latest

### Code Reference:
- **Frontend**: `dashboard/src/pages/Analytics.jsx`
- **Backend**: `server.js` (line 863, 886)
- **Database Service**: `services/database.js`

---

## 13. User Creates Template

### What Happens:
User saves a post as a reusable template for future use.

### Step-by-Step Explanation:

1. **User clicks "Templates"** in navigation
2. **Clicks "New Template"** button
3. **Modal opens** with form
4. **User fills in**:
   - Name: "Product Launch Template"
   - Category: "Marketing"
   - Content: "Introducing {{product_name}}! Available now at {{url}}"
5. **Uses variables**: {{product_name}} and {{url}} as placeholders
6. **Clicks "Save Template"**
7. **Frontend calls**: `POST /api/templates`
8. **Backend saves to database**: With user ID
9. **Template appears in list**
10. **Later, user can**:
    - Click template to use it
    - Fill in variables
    - Post with customized content

### Code Reference:
- **Frontend**: `dashboard/src/pages/Templates.jsx`
- **Backend**: `server.js` (line 2151)
- **Templates Service**: `services/templates.js`

---

## 14. User Upgrades Plan

### What Happens:
User subscribes to a paid plan (Pro or Business) via Stripe.

### Step-by-Step Explanation:

1. **User clicks "Upgrade"** in dashboard
2. **Pricing modal shows** with 3 plans:
   - Free: 10 posts/month
   - Pro: $29/month, unlimited posts, 100 AI/month
   - Business: $99/month, everything unlimited
3. **User clicks "Choose Pro"**
4. **Frontend calls**: `POST /api/billing/checkout`
5. **Backend creates Stripe session**
6. **User redirected to Stripe**: Secure payment page
7. **User enters card details**
8. **Payment processes**
9. **Stripe webhook notifies backend**: `checkout.session.completed`
10. **Backend updates user plan**: In database
11. **User redirected back**: To success page
12. **Limits updated**: Can now post unlimited, use AI 100 times
13. **Pro badge shows**: In UI next to username

### Code Reference:
- **Frontend**: `dashboard/src/components/UpgradeModal.jsx`
- **Backend**: `server.js` (line 2368, 2413)
- **Billing Service**: `services/billing.js`

---

## 15. System Posts Scheduled Content

### What Happens:
The backend automatically posts scheduled content at the right time.

### Flow Diagram:
```
⏰ Cron Job         🗄️ Database         🌐 Social APIs       📊 Posts Table
  │                     │                     │                    │
  │ 1. Every minute     │                     │                    │
  │    check queue      │                     │                    │
  ├────────────────────>│                     │                    │
  │                     │                     │                    │
  │ 2. Query for posts  │                     │                    │
  │    where time <=    │                     │                    │
  │    NOW()            │                     │                    │
  ├────────────────────>│                     │                    │
  │                     │                     │                    │
  │ 3. Return 3 posts   │                     │                    │
  │    due now          │                     │                    │
  │<────────────────────┤                     │                    │
  │                     │                     │                    │
  │ 4. For each post:   │                     │                    │
  │    Get credentials  │                     │                    │
  ├────────────────────>│                     │                    │
  │                     │                     │                    │
  │ 5. Return tokens    │                     │                    │
  │<────────────────────┤                     │                    │
  │                     │                     │                    │
  │ 6. Post to Twitter  │                     │                    │
  ├────────────────────────────────────────────>│                    │
  │                     │                     │                    │
  │ 7. ✅ Posted        │                     │                    │
  │<────────────────────────────────────────────┤                    │
  │                     │                     │                    │
  │ 8. Post to LinkedIn │                     │                    │
  ├────────────────────────────────────────────>│                    │
  │                     │                     │                    │
  │ 9. ✅ Posted        │                     │                    │
  │<────────────────────────────────────────────┤                    │
  │                     │                     │                    │
  │ 10. Update status   │                     │                    │
  │     to 'posted'     │                     │                    │
  ├──────────────────────────────────────────────────────────────────>│
  │                     │                     │                    │
  │ 11. Delete from     │                     │                    │
  │     queue           │                     │                    │
  ├────────────────────>│                     │                    │
  │                     │                     │                    │
  │ ✅ Scheduled posts  │                     │                    │
  │    processed!       │                     │                    │
```

### Step-by-Step Explanation:

1. **Cron job starts**: When server starts, scheduler begins
2. **Runs every minute**: At :00 seconds of each minute
3. **Queries database**: `SELECT * FROM scheduled_posts WHERE schedule_time <= NOW()`
4. **Finds posts due now**: e.g., 3 posts scheduled for 2:00 PM (it's now 2:00 PM)
5. **For each post**:
   - Gets user's credentials from database
   - Gets post content and platforms
6. **Posts to each platform**: Calls Twitter, LinkedIn, etc.
7. **Saves result**: Updates `posts` table with status
8. **Removes from queue**: Deletes from `scheduled_posts`
9. **Logs activity**: Console shows "✅ Posted scheduled content (ID: 123)"
10. **User notified**: (Future feature: email/push notification)
11. **Continues**: Waits for next minute, repeats

### Code Reference:
- **Scheduler**: `services/scheduler.js`
- **Cron Setup**: `server.js` (line 212)

---

## 🎯 Summary

You now understand all major user flows in the Social Media Automator:

✅ **Authentication** - Signup, Login  
✅ **Connections** - Instagram, Twitter, LinkedIn, Telegram  
✅ **Content Creation** - Post now, Schedule, AI generation  
✅ **Media** - Upload images/videos, AI image generation  
✅ **Management** - Analytics, Templates  
✅ **Billing** - Upgrade plans  
✅ **Automation** - Background posting  

**All flows follow the same pattern:**
1. User action in React frontend
2. API call with JWT auth
3. Backend processes request
4. External services called
5. Data saved to database
6. Response shown to user

**Want to see a specific flow in action?** Just visit http://localhost:3000 and try it!

