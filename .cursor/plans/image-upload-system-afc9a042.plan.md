<!-- afc9a042-47e1-4de3-9619-ed68b134bc3c 8cce67c8-f3dc-47e1-b269-8b22aa7ad22d -->
# Image Upload System Implementation

## Overview

Add image upload capability to the social media automator, allowing users to upload images from their computer, store them in Cloudinary, and post them to LinkedIn and Twitter.

## Phase 1: Backend Setup

### 1. Install Dependencies

Install required packages for image handling and Cloudinary integration:

- `cloudinary` - Cloud storage for images
- `multer` - File upload middleware
- `axios` - HTTP client for API calls

### 2. Add Environment Variables

Add Cloudinary credentials to `.env` and Railway:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### 3. Create Cloudinary Service (`services/cloudinary.js`)

New service file with functions:

- `uploadImage(filePath, userId)` - Upload to Cloudinary with optimization
- `deleteImage(publicId)` - Remove images if needed

Image transformations applied:

- Max dimensions: 1200x630 (social media optimized)
- Auto quality and format
- Organized by user ID in folders

### 4. Update Database Schema

Run SQL migration in Supabase to add image columns to `posts` table:

- `image_url` (TEXT) - Cloudinary URL
- `image_source` (TEXT) - Track source ('none', 'upload')
- Index on `image_source` for performance

### 5. Add Upload Endpoint (`server.js`)

Create `POST /api/upload/image` endpoint:

- Use multer middleware for file handling
- Validate file type (images only) and size (10MB max)
- Upload to Cloudinary via service
- Clean up temporary files
- Track usage in database
- Return image URL

### 6. Update Post Endpoints

Modify existing post endpoints to accept image parameters:

- `POST /api/post/now` - Add `imageUrl` and `imageSource` fields
- Update `database.createPost()` to store image data

### 7. Update Platform Services

Enhance LinkedIn and Twitter services to support images:

**`services/linkedin.js`**:

- Add `imageUrl` parameter to `postToLinkedIn()`
- Use `shareMediaCategory: 'IMAGE'` when image present
- Include media array in API payload

**`services/twitter.js`**:

- Add `imageUrl` parameter to `postToTwitter()`
- Download image from Cloudinary URL
- Upload to Twitter media endpoint
- Attach `media_ids` to tweet payload

## Phase 2: Frontend Implementation

### 8. Update Dashboard HTML (`dashboard.html`)

Add image upload section in post creation form:

- File input with drag-and-drop area
- Image preview with remove button
- Loading state during upload
- File type/size validation messages
- Visual feedback for upload success/error

Key UI elements:

- Drag-and-drop upload zone
- Image preview container
- Remove image button
- Upload progress indicator

### 9. Add JavaScript Functions (`dashboard.html` script section)

Implement image handling logic:

- `handleImageUpload(event)` - Process file selection
- Validate file size (10MB max)
- Validate file type (images only)
- Upload to backend via FormData
- Show preview on success
- `removeImage()` - Clear uploaded image
- `showImagePreview(url)` - Display uploaded image
- Update `postNow()` to include `imageUrl` and `imageSource` in request

Global state variables:

- `currentImageUrl` - Store uploaded image URL
- `currentImageSource` - Track source ('upload')

### 10. Update Post Submission

Modify post creation functions to send image data:

- Include `imageUrl` in POST request body
- Include `imageSource` in POST request body
- Handle responses with image metadata

## Phase 3: Testing & Deployment

### 11. Local Testing

Test complete flow:

- Upload various image formats (JPG, PNG, GIF)
- Verify Cloudinary storage
- Test file size limits
- Test file type validation
- Post to LinkedIn with image
- Post to Twitter with image
- Verify image appears in both platforms

### 12. Deploy to Production

- Commit all changes with descriptive message
- Push to GitHub (triggers Railway auto-deploy)
- Add environment variables to Railway dashboard
- Verify production deployment
- Test upload in production environment

## Key Files to Modify

1. `services/cloudinary.js` - NEW (create)
2. `services/linkedin.js` - UPDATE (add image support)
3. `services/twitter.js` - UPDATE (add image support)
4. `services/database.js` - UPDATE (add image fields to createPost)
5. `server.js` - UPDATE (add upload endpoint, multer config)
6. `dashboard.html` - UPDATE (add upload UI and JavaScript)
7. `.env` - UPDATE (add Cloudinary credentials)
8. `package.json` - UPDATE (add dependencies)

## Success Criteria

- Users can upload images from their computer
- Images are stored in Cloudinary with optimization
- Images appear in LinkedIn posts
- Images appear in Twitter posts
- UI provides clear feedback during upload
- File validation prevents invalid uploads
- Production deployment works correctly

## Estimated Time: 2 hours

- Backend setup: 45 minutes
- Frontend implementation: 45 minutes
- Testing: 20 minutes
- Deployment: 10 minutes

### To-dos

- [ ] Install cloudinary, multer, and axios packages
- [ ] Add Cloudinary credentials to .env and Railway
- [ ] Create services/cloudinary.js with upload and delete functions
- [ ] Run SQL migration to add image_url and image_source columns to posts table
- [ ] Add POST /api/upload/image endpoint with multer middleware in server.js
- [ ] Update database.createPost() to accept and store imageUrl and imageSource
- [ ] Add image support to services/linkedin.js postToLinkedIn()
- [ ] Add image upload to services/twitter.js postToTwitter()
- [ ] Modify POST /api/post/now to accept imageUrl and imageSource parameters
- [ ] Add image upload UI to dashboard.html with drag-and-drop and preview
- [ ] Implement handleImageUpload(), removeImage(), and update postNow() in dashboard.html
- [ ] Test upload flow, file validation, and posting to LinkedIn/Twitter
- [ ] Commit, push to GitHub, configure Railway env vars, and verify production