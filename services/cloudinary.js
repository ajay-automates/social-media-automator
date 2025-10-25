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

module.exports = {
  uploadImage,
  deleteImage
};

