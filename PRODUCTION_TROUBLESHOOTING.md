# Production Troubleshooting Guide

## Issues Fixed (December 2024)

### 1. Calendar Not Loading
**Problem:** Calendar page couldn't load scheduled posts in production.

**Fixes Applied:**
- ✅ Added detailed console logging for API calls
- ✅ Improved error handling with status codes and response data
- ✅ Fixed date parsing to handle edge cases
- ✅ Ensured API responses are properly formatted

**How to Debug:**
1. Open browser console (F12)
2. Navigate to Calendar page
3. Look for logs starting with `📅`:
   - `📅 Loading scheduled posts...`
   - `📅 API Response:` (should show response data)
   - `📅 Found X scheduled posts`
4. If errors appear, check:
   - `❌ Error loading scheduled posts:` - Shows full error details
   - Status code (401 = auth issue, 500 = server error)

### 2. Accounts Not Connected
**Problem:** Connected accounts not showing in Settings page.

**Fixes Applied:**
- ✅ Added detailed console logging for accounts API
- ✅ Improved error messages with status codes
- ✅ Better error handling for empty responses

**How to Debug:**
1. Open browser console (F12)
2. Navigate to Settings page
3. Look for logs starting with `👤`:
   - `👤 Loading connected accounts...`
   - `👤 API Response:` (should show accounts array)
   - `👤 Found X connected accounts`
4. If errors appear, check:
   - `❌ Error loading accounts:` - Shows full error details
   - Status code (401 = auth issue, 500 = server error)

## Common Issues & Solutions

### Authentication Issues (401 Errors)

**Symptoms:**
- Calendar shows "Failed to load scheduled posts"
- Settings shows no connected accounts
- Console shows `401 Unauthorized`

**Solutions:**
1. **Check Supabase Session:**
   ```javascript
   // In browser console:
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```
   - If `session` is `null`, user needs to log in again
   - If session exists, check if token is expired

2. **Check API Interceptor:**
   - Open `dashboard/src/lib/api.js`
   - Verify `Authorization` header is being set
   - Check console for `🔑 Auth session:` logs

3. **Verify Backend Auth:**
   - Check Railway logs for `👤 Auth Verified:` messages
   - If no auth logs, verifyAuth middleware might be failing

### API Endpoint Issues (404/500 Errors)

**Symptoms:**
- Console shows `404 Not Found` or `500 Internal Server Error`
- Network tab shows failed requests

**Solutions:**
1. **Verify API Base URL:**
   - Check `dashboard/src/lib/api.js` - should use `/api` (relative)
   - In production, this should resolve to `https://your-domain.com/api`

2. **Check Server Routes:**
   - Verify `/api/posts/scheduled` exists in `server.js` (line 1649)
   - Verify `/api/accounts` exists in `server.js` (line 713)

3. **Check Railway Deployment:**
   - Verify server is running (check `/api/health` endpoint)
   - Check Railway logs for errors
   - Verify environment variables are set

### CORS Issues

**Symptoms:**
- Console shows CORS errors
- Requests fail with "No 'Access-Control-Allow-Origin' header"

**Solutions:**
1. **Check CORS Configuration:**
   - Verify `server.js` has `app.use(cors())` (line 322)
   - Check `FRONTEND_URL` environment variable in Railway

2. **Verify Frontend URL:**
   - Railway should have `FRONTEND_URL` set to production domain
   - Check `getFrontendUrl()` function in `server.js` (line 212)

### Database Connection Issues

**Symptoms:**
- 500 errors on API calls
- Server logs show database connection errors

**Solutions:**
1. **Check Supabase Environment Variables:**
   - `SUPABASE_URL` - Should be your Supabase project URL
   - `SUPABASE_ANON_KEY` - Should be your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Should be your service role key

2. **Verify Database Access:**
   - Check Supabase dashboard for connection status
   - Verify RLS policies allow user access
   - Check if tables exist (`posts`, `user_accounts`)

## Debugging Steps

### Step 1: Check Browser Console
1. Open production site
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for error messages (red text)
5. Check Network tab for failed requests

### Step 2: Check Railway Logs
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check logs for errors

### Step 3: Test API Endpoints Directly
```bash
# Test health endpoint (no auth required)
curl https://your-domain.com/api/health

# Test scheduled posts (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/posts/scheduled

# Test accounts (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/accounts
```

### Step 4: Verify Environment Variables
In Railway dashboard, verify these are set:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` (should be your production domain)
- `NODE_ENV=production`

## Quick Fixes

### If Calendar Still Not Loading:
1. Clear browser cache and cookies
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if user is logged in
4. Try logging out and back in

### If Accounts Not Showing:
1. Check if accounts exist in database:
   ```sql
   SELECT * FROM user_accounts WHERE user_id = 'USER_ID';
   ```
2. Verify OAuth flow completed successfully
3. Check if account status is 'active'

### If Nothing Works:
1. Check Railway deployment status
2. Verify server is running (check `/api/health`)
3. Check Supabase connection
4. Review Railway logs for errors
5. Contact support with error logs

## Monitoring

After fixes are deployed, monitor:
- Browser console for errors
- Railway logs for server errors
- User reports of issues
- API response times

## Next Steps

If issues persist:
1. Collect error logs from browser console
2. Collect server logs from Railway
3. Test API endpoints directly
4. Verify all environment variables
5. Check database connectivity

