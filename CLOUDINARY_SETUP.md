# 🎨 Cloudinary Setup Guide

## Overview
Cloudinary is used to store and serve images for your social media posts. It provides:
- Fast CDN delivery
- Automatic image optimization
- Generous free tier (25GB storage, 25GB bandwidth/month)

## Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up with your email or Google account
3. Verify your email address

## Step 2: Get Your Credentials

Once logged in to Cloudinary dashboard:

1. Click on the **Dashboard** link in the top navigation
2. You'll see your account details section with:
   - **Cloud Name**: Your unique identifier (e.g., `dv7x8mync`)
   - **API Key**: Your public API key (e.g., `123456789012345`)
   - **API Secret**: Your private API secret (e.g., `AbCd1234...`) - Click "Reveal" to show it

3. Copy these three values

## Step 3: Add to .env File

Open your `.env` file and add these lines:

```bash
# Cloudinary (Image Storage & CDN)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the placeholder values with your actual credentials:

```bash
# Example (use your real values)
CLOUDINARY_CLOUD_NAME=dv7x8mync
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGh1234567890AbCdEfGh1234
```

## Step 4: Add to Railway (Production)

For your Railway production deployment:

1. Go to https://railway.app/dashboard
2. Select your project
3. Click on your service
4. Click **Variables** tab
5. Click **+ New Variable** and add:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
6. Railway will automatically redeploy with new variables

## Step 5: Test the Integration

1. Restart your local server:
   ```bash
   npm start
   ```

2. Go to http://localhost:3000/dashboard

3. Try uploading an image:
   - Click the image upload area
   - Select an image (JPG, PNG, or GIF)
   - You should see a loading spinner, then preview

4. Check Cloudinary dashboard:
   - Go to **Media Library** in Cloudinary
   - You should see a folder `social-media-automator/[your-user-id]`
   - Your uploaded image will be there

## What Happens When You Upload

1. **User uploads** image from their computer
2. **Backend receives** file via Multer
3. **Cloudinary** receives file and:
   - Optimizes image quality
   - Resizes to max 1200x630px (social media optimized)
   - Converts to best format (WebP, etc.)
   - Stores in your account
4. **Backend receives** secure URL from Cloudinary
5. **Frontend displays** preview using Cloudinary URL
6. **Post is created** with Cloudinary URL
7. **Platforms receive** image from Cloudinary CDN

## Image Organization

Images are organized by user ID:
```
social-media-automator/
  └── user-id-1/
      ├── image1.jpg
      ├── image2.png
      └── ...
  └── user-id-2/
      ├── image1.jpg
      └── ...
```

This keeps each user's images separate and makes it easy to:
- Track usage per user
- Delete user data if needed
- Organize by folders

## Free Tier Limits

Cloudinary's free tier includes:
- ✅ **25 GB** storage
- ✅ **25 GB** bandwidth per month
- ✅ **25,000** transformations per month
- ✅ Unlimited image uploads

This is plenty for starting out! If you need more:
- **Plus Plan**: $99/month (85GB storage, 160GB bandwidth)
- **Advanced Plan**: $249/month (420GB storage, 420GB bandwidth)

## Optimization Features

Cloudinary automatically applies:

1. **Quality Optimization**: `quality: 'auto'`
   - Adjusts quality based on image content
   - Reduces file size without visible quality loss

2. **Format Selection**: `fetch_format: 'auto'`
   - Serves WebP to modern browsers
   - Falls back to JPG/PNG for older browsers

3. **Size Limiting**: `width: 1200, height: 630, crop: 'limit'`
   - Never upscales images
   - Maintains aspect ratio
   - Perfect for social media (LinkedIn, Twitter, Instagram)

## Security

- **API Secret** is kept on server-side only (never exposed to frontend)
- **Signed URLs** can be enabled for extra security
- **Upload presets** control who can upload what
- **Access control** limits who can view/download images

## Troubleshooting

### Error: "Invalid cloud_name"
- Check your CLOUDINARY_CLOUD_NAME is correct
- No spaces, no quotes in .env file

### Error: "Invalid API key"
- Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
- Make sure you copied the full API secret (click "Reveal" in dashboard)

### Images not uploading
- Check server logs for Cloudinary errors
- Verify file size is under 10MB
- Ensure image format is supported (JPG, PNG, GIF)

### "Quota exceeded" error
- Check your Cloudinary dashboard usage
- Free tier: 25GB storage, 25GB bandwidth/month
- Upgrade plan if needed

## Additional Features (Future)

You can extend Cloudinary integration with:

1. **Video support**: Upload and stream videos
2. **Advanced transformations**: Filters, effects, overlays
3. **Face detection**: Auto-crop to faces
4. **Background removal**: AI-powered background removal
5. **Image tags**: Auto-tag images with AI
6. **Responsive images**: Serve different sizes per device

## Support

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **API Reference**: https://cloudinary.com/documentation/image_upload_api_reference
- **Support**: https://support.cloudinary.com

---

✅ Once configured, your image upload system is ready!
Users can now upload images from their computer and post them to LinkedIn and Twitter.

