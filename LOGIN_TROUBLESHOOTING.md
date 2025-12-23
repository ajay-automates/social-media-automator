# 🔐 Login Troubleshooting Guide

## ✅ **Quick Fix - Login Page**

The login page is accessible at:
- **Backend Server:** `http://localhost:3000/auth`
- **Dashboard (via proxy):** `http://localhost:5173/auth`

---

## 🚀 **Steps to Login**

### **1. Make Sure Backend Server is Running**
The backend server must be running on port 3000 for authentication to work.

**Check if running:**
- Open PowerShell and check: `Get-NetTCPConnection -LocalPort 3000`
- Or visit: `http://localhost:3000` (should show server info)

**Start backend server:**
```powershell
cd "C:\Users\AjayNelavetla\OneDrive - Folderwave, Inc\Desktop\PERSONAL\Social Media Automator"
node server.js
```

### **2. Access Login Page**
Open your browser and go to:
- **Option 1:** `http://localhost:3000/auth`
- **Option 2:** `http://localhost:5173/auth` (via dashboard proxy)

### **3. Sign Up or Sign In**

**If you don't have an account:**
1. Click "Sign Up" tab
2. Enter your email and password (min 6 characters)
3. Click "Create Account"
4. You'll be redirected to the dashboard

**If you have an account:**
1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to the dashboard

### **4. Social Login Options**
You can also sign in with:
- **Google** - Click "Sign up with Google"
- **GitHub** - Click "Sign up with GitHub"

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: "Supabase not configured" Error**

**Solution:**
The Supabase credentials are hardcoded in `auth.html` and `dashboard/src/lib/supabase.js`. They should work, but if you see this error:

1. Check `dashboard/public/auth.html` line 224-225
2. Verify Supabase URL and key are correct
3. Make sure backend server has access to environment variables (if using .env)

**Current Supabase Config:**
- URL: `https://gzchblilbthkfuxqhoyo.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Issue 2: "Cannot connect to server"**

**Solution:**
1. Make sure backend server is running on port 3000
2. Check PowerShell window for errors
3. Verify no other app is using port 3000
4. Try restarting the backend server

### **Issue 3: "Invalid credentials"**

**Solution:**
1. Make sure you're using the correct email/password
2. If you forgot password, click "Forgot Password" link
3. Try creating a new account with a different email
4. Check browser console (F12) for detailed error messages

### **Issue 4: Login page shows but can't submit**

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab to see if requests are being made
4. Verify Supabase client is initialized (check console logs)

### **Issue 5: Redirects to login page after signing in**

**Solution:**
1. Check browser localStorage:
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Look for `supabase.auth.token` or `sb-*-auth-token`
2. Clear localStorage and try again
3. Check if backend server is verifying tokens correctly

---

## 📋 **Authentication Flow**

1. **User visits** `/auth` page
2. **Enters credentials** (email/password or social login)
3. **Supabase authenticates** user
4. **Session token** stored in localStorage
5. **Redirects to** `/dashboard` or `/`
6. **Dashboard checks** for session token
7. **API calls** include token in Authorization header
8. **Backend verifies** token with Supabase

---

## 🔍 **Debug Steps**

### **Step 1: Check Backend Server**
```powershell
# Check if port 3000 is listening
Get-NetTCPConnection -LocalPort 3000

# Check if node process is running
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### **Step 2: Check Browser Console**
1. Open login page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors or warnings
5. Check Network tab when submitting form

### **Step 3: Check Supabase Connection**
1. Open browser console
2. Type: `localStorage.getItem('supabase.auth.token')`
3. Should return a token if logged in
4. Check for `sb-*-auth-token` keys

### **Step 4: Test API Endpoint**
```powershell
# Test if backend is responding
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
```

---

## 📞 **Quick Access URLs**

- **Login Page:** `http://localhost:3000/auth`
- **Dashboard:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/api/health`

---

## ✅ **Expected Behavior**

**When login works correctly:**
1. ✅ Login page loads without errors
2. ✅ Can enter email/password
3. ✅ Form submits successfully
4. ✅ Redirects to dashboard
5. ✅ Dashboard shows user info
6. ✅ Can make API calls (check Network tab)

**If any step fails, check the error message and refer to solutions above.**

---

## 🆘 **Still Can't Login?**

1. **Check all servers are running:**
   - Backend (port 3000) ✅
   - Dashboard (port 5173) ✅
   - Landing (port 5174) ✅

2. **Check browser console** for errors

3. **Try incognito/private mode** to rule out cache issues

4. **Clear browser cache and localStorage**

5. **Restart all servers** and try again

6. **Check Supabase dashboard** to verify project is active

---

**Last Updated:** January 2025

