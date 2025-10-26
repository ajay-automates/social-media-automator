const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the uploaded file
 * @param {string} userId - User ID (for organizing uploads)
 * @returns {Promise<Object>} - Cloudinary upload result with URL
 */
async function uploadImage(filePath, userId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `social-media-automator/${userId}`,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 630, crop: 'limit' }, // Optimize for social media
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('✅ Image uploaded to Cloudinary:', result.secure_url);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>}
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload base64 image to Cloudinary (for AI-generated images)
 * @param {string} base64Image - Base64 encoded image
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>}
 */
async function uploadBase64Image(base64Image, userId) {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      {
        folder: `social-media-automator/${userId}/ai-generated`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      }
    );

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('❌ Cloudinary base64 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload video to Cloudinary
 * @param {string} filePath - Path to the uploaded video file
 * @param {string} userId - User ID (for organizing uploads)
 * @returns {Promise<Object>} - Cloudinary upload result with URL
 */
async function uploadVideo(filePath, userId) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `social-media-automator/${userId}/videos`,
      resource_type: 'video',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('✅ Video uploaded to Cloudinary:', result.secure_url);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('❌ Cloudinary video upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  uploadImage,
  uploadBase64Image,
  deleteImage,
  uploadVideo  // Add to exports
};

