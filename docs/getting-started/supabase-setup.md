# Supabase Database Setup Guide

Quick guide to set up your Supabase database for the Social Media Automator.

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the SQL Migration

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project: **gzchblilbthkfuxqhoyo**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `migrations/001_initial_schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

You should see:
```
✅ Database schema created successfully!
📊 Tables: posts, post_analytics  
📈 Views: platform_stats, daily_activity
```

### Step 2: Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. You should see two new tables:
   - **posts** - Main queue and post history
   - **post_analytics** - Platform-specific analytics

### Step 3: Add Environment Variables

Already done! Your `.env` file should have:
```env
SUPABASE_URL=https://gzchblilbthkfuxqhoyo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Database Schema

### `posts` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `text` | TEXT | Post caption/content |
| `image_url` | TEXT | URL to image/video |
| `platforms` | TEXT[] | Array: ['linkedin', 'twitter', 'instagram'] |
| `status` | VARCHAR(20) | queued, posted, failed, partial, draft |
| `schedule_time` | TIMESTAMPTZ | When to post |
| `created_at` | TIMESTAMPTZ | When created |
| `posted_at` | TIMESTAMPTZ | When actually posted |
| `results` | JSONB | Platform-specific results |
| `error_message` | TEXT | Error details if failed |

### `post_analytics` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `post_id` | BIGINT | Foreign key to posts |
| `platform` | VARCHAR(50) | linkedin, twitter, instagram |
| `platform_post_id` | TEXT | ID from the platform |
| `success` | BOOLEAN | Did it post successfully? |
| `error_message` | TEXT | Error details |
| `posted_at` | TIMESTAMPTZ | When posted |

## 🔍 Useful Queries

### Check recent posts
```sql
SELECT id, text, platforms, status, schedule_time
FROM posts
ORDER BY created_at DESC
LIMIT 10;
```

### See platform success rates
```sql
SELECT * FROM platform_stats;
```

### Check daily activity
```sql
SELECT * FROM daily_activity;
```

### Find failed posts
```sql
SELECT id, text, platforms, error_message, posted_at
FROM posts
WHERE status = 'failed'
ORDER BY posted_at DESC;
```

## 🛠️ Troubleshooting

### Error: "relation 'posts' does not exist"
- Run the SQL migration again
- Make sure you're in the correct project

### Error: "permission denied for table posts"
- Check that RLS policies are created
- Use the service role key if needed

### Can't see any data
- Check the **Table Editor** in Supabase
- Run: `SELECT COUNT(*) FROM posts;`

## 🎉 You're All Set!

Once the migration runs successfully, your app will:
- ✅ Store all posts in the database (no more lost data!)
- ✅ Keep full post history
- ✅ Track success rates per platform
- ✅ Survive server restarts

## 🔗 Useful Links

- [Your Supabase Dashboard](https://supabase.com/dashboard/project/gzchblilbthkfuxqhoyo)
- [SQL Editor](https://supabase.com/dashboard/project/gzchblilbthkfuxqhoyo/sql)
- [Table Editor](https://supabase.com/dashboard/project/gzchblilbthkfuxqhoyo/editor)
- [Supabase Documentation](https://supabase.com/docs)

---

**Next Step**: Test the integration by running `npm start` and scheduling a post!

