-- Add image support to posts table
-- Run this in Supabase SQL Editor

-- Add image_url column to store Cloudinary image URL
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_source column to track where image came from
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'none';

-- Add comments for documentation
COMMENT ON COLUMN posts.image_url IS 'Cloudinary image URL for the post';
COMMENT ON COLUMN posts.image_source IS 'Source of image: none, upload, or ai-generated';

-- Add index for faster queries on image_source
CREATE INDEX IF NOT EXISTS idx_posts_image_source ON posts(image_source);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('image_url', 'image_source');

