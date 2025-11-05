# Public Template Library Setup Guide

## 🌐 Overview

This setup makes the 15 starter templates available to **ALL users** as a public template library.

## 📋 Setup Steps

### Step 1: Run SQL Migration

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `migrations/012_add_public_templates.sql`
4. Click **Run**

This will:
- Add `is_public` column to `post_templates` table
- Update RLS policies to allow viewing public templates
- Create index for performance

### Step 2: Mark Templates as Public

Run this command locally:

```bash
node scripts/mark-templates-public-simple.js
```

This will mark the 15 starter templates as public.

### Step 3: Deploy to Production

```bash
git add .
git commit -m "feat: Add public template library"
git push origin main
```

Railway will auto-deploy the changes.

---

## ✨ What Users Will See

### Before (Current):
- Users see only their own templates
- New users start with 0 templates
- Each user must create templates from scratch

### After (With Public Library):
- **ALL users see 15 professional starter templates**
- Templates are marked with 🌐 "Public Template" badge
- Users can click "✨ Clone to My Templates" to customize
- Cloned templates become private and editable
- Original public templates cannot be edited/deleted

---

## 📚 Public Template Library (15 Templates)

### Promotional (4)
1. Product Launch Announcement
2. Flash Sale
3. Customer Testimonial
4. (varies)

### Educational (4)
1. Tip of the Day
2. How-To Guide
3. Industry News Share
4. (varies)

### Engagement (4)
1. Welcome New Followers
2. Monday Motivation
3. Weekend Vibes
4. Question of the Day

### Announcement (2)
1. Milestone Celebration
2. Webinar/Event Invitation

### Personal (2)
1. Behind the Scenes
2. Team Spotlight

### Seasonal (1)
1. Holiday Greeting

---

## 🔧 Technical Implementation

### Backend Changes
- `services/templates.js`: Updated `getTemplates()` to include public templates
- `services/templates.js`: Added `clonePublicTemplate()` function
- `server.js`: Added `/api/templates/:id/clone` endpoint
- Templates now include `is_owned`, `can_edit`, `can_delete` flags

### Frontend Changes
- `Templates.jsx`: Shows 🌐 "Public" badge on public templates
- `Templates.jsx`: Shows "✨ Clone to My Templates" button for public templates
- `Templates.jsx`: Hides Edit/Delete buttons for public templates
- `CreatePost.jsx`: Shows public badge in template loader modal
- Templates are sorted: Public templates first, then personal templates

### Database Schema
```sql
ALTER TABLE post_templates 
ADD COLUMN is_public BOOLEAN DEFAULT false;
```

### RLS Policy Update
```sql
CREATE POLICY "Users can view own and public templates"
  ON post_templates FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_public = true
  );
```

---

## 🎯 User Experience

### Discovering Public Templates
1. User goes to Templates page
2. Sees 15 professional templates at the top (marked "Public")
3. Can search/filter these templates
4. Cannot edit/delete public templates

### Cloning a Template
1. User clicks "✨ Clone to My Templates" on any public template
2. A private copy is created in their account
3. They can now edit, favorite, and customize it
4. Original public template remains unchanged

### Using in Create Post
1. User clicks "📋 Load from Template" in Create Post
2. Sees both public templates and their personal templates
3. Public templates show 🌐 badge
4. Can load any template directly into the post form

---

## 🔒 Security & Permissions

- **Public templates are READ-ONLY** for all users except system
- **RLS policies** ensure users can only edit their own templates
- **Cloning** creates a private copy with `user_id` set to current user
- **Original public templates** cannot be modified by any user

---

## 🚀 Future Enhancements

Potential additions:
- Admin dashboard to manage public templates
- Community templates (users can share their templates)
- Template ratings and reviews
- Template categories and tags
- Template preview before cloning
- Recommended templates based on user's niche

---

## 🐛 Troubleshooting

### "Column is_public does not exist"
- Run the SQL migration in Supabase SQL Editor first

### "No templates found"
- Make sure you've run `scripts/seed-templates.js` first to create the 15 templates

### "Permission denied"
- Check that RLS policies are updated correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`

### Templates not showing as public
- Run `scripts/mark-templates-public-simple.js` again
- Check Supabase dashboard to verify `is_public = true`

---

## ✅ Verification

After setup, verify:

1. **Database**: Check `post_templates` table has `is_public` column
2. **Templates**: Verify 15 templates have `is_public = true`
3. **RLS**: Confirm new policy allows viewing public templates
4. **Frontend**: Public templates show 🌐 badge
5. **Clone**: Users can successfully clone public templates

---

**Setup complete! All users now have access to professional starter templates!** 🎉

