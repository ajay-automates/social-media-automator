const axios = require('axios');
const cloudinary = require('cloudinary').v2;

/**
 * Carousel Posts Service
 * Handles creation, validation, and posting of multi-image carousels
 */

/**
 * Create carousel post data structure
 * @param {Object} carouselData - { images, captions, platform, captionMode }
 * @returns {Object} - Formatted carousel post
 */
function createCarouselPost(carouselData) {
  const { images, captions, platform, captionMode } = carouselData;
  
  return {
    type: 'carousel',
    platform,
    images,
    captions: captionMode === 'single' ? [captions[0]] : captions,
    captionMode,
    slideCount: images.length,
    createdAt: new Date().toISOString()
  };
}

/**
 * Validate carousel requirements per platform
 * @param {string} platform - Platform name
 * @param {Array} images - Array of image data
 * @returns {boolean} - True if valid
 * @throws {Error} - If validation fails
 */
function validateCarousel(platform, images) {
  const requirements = {
    linkedin: { 
      min: 2, 
      max: 10, 
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['image/jpeg', 'image/png']
    },
    instagram: { 
      min: 2, 
      max: 10, 
      maxSize: 8 * 1024 * 1024, // 8MB
      formats: ['image/jpeg', 'image/png']
    },
    twitter: { 
      min: 2, 
      max: 4, 
      maxSize: 5 * 1024 * 1024, // 5MB
      formats: ['image/jpeg', 'image/png', 'image/gif']
    }
  };
  
  if (!requirements[platform]) {
    throw new Error(`Platform ${platform} does not support carousels`);
  }
  
  const req = requirements[platform];
  
  // Check slide count
  if (images.length < req.min || images.length > req.max) {
    throw new Error(`${platform} requires ${req.min}-${req.max} images (you have ${images.length})`);
  }
  
  // Validate each image
  images.forEach((img, i) => {
    if (img.size && img.size > req.maxSize) {
      const sizeMB = (req.maxSize / (1024 * 1024)).toFixed(0);
      throw new Error(`Image ${i + 1} exceeds ${sizeMB}MB limit for ${platform}`);
    }
    
    if (img.mimetype && !req.formats.includes(img.mimetype)) {
      throw new Error(`Image ${i + 1} has unsupported format. Supported: ${req.formats.join(', ')}`);
    }
  });
  
  console.log(`✅ Carousel validation passed for ${platform}: ${images.length} images`);
  return true;
}

/**
 * Get platform-specific carousel limits
 * @param {string} platform - Platform name
 * @returns {Object} - Platform requirements
 */
function getCarouselLimits(platform) {
  const limits = {
    linkedin: { min: 2, max: 10, maxSizeMB: 10 },
    instagram: { min: 2, max: 10, maxSizeMB: 8 },
    twitter: { min: 2, max: 4, maxSizeMB: 5 }
  };
  
  return limits[platform] || { min: 2, max: 10, maxSizeMB: 10 };
}

/**
 * Format carousel metadata for database storage
 * @param {Object} carousel - Carousel data
 * @returns {Object} - Metadata object
 */
function formatCarouselMetadata(carousel) {
  return {
    type: 'carousel',
    slideCount: carousel.images.length,
    images: carousel.images,
    captions: carousel.captions,
    captionMode: carousel.captionMode || 'single',
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  createCarouselPost,
  validateCarousel,
  getCarouselLimits,
  formatCarouselMetadata
};

