const { parse } = require('csv-parse/sync');

const VALID_PLATFORMS = ['linkedin', 'twitter', 'tiktok', 'youtube', 'reddit', 'discord', 'slack', 'telegram'];

/**
 * Parse and validate CSV file for bulk post scheduling
 * Expected columns: schedule_datetime, caption, platforms, image_url, reddit_title, reddit_subreddit
 */
function parseCSV(csvContent) {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    return records.map((record, index) => {
      const rowNumber = index + 2; // +2 because: +1 for header, +1 for 0-index
      const errors = [];
      const warnings = [];

      // Validate schedule_datetime
      let scheduleDate = null;
      if (!record.schedule_datetime || record.schedule_datetime.trim() === '') {
        errors.push('Schedule datetime is required');
      } else {
        scheduleDate = parseDatetime(record.schedule_datetime);
        if (!scheduleDate) {
          errors.push(`Invalid datetime format: "${record.schedule_datetime}". Use: YYYY-MM-DD HH:MM or ISO format`);
        } else if (scheduleDate < new Date()) {
          warnings.push('Scheduled time is in the past');
        }
      }

      // Validate caption
      if (!record.caption || record.caption.trim() === '') {
        errors.push('Caption is required');
      } else if (record.caption.length > 40000) {
        errors.push('Caption is too long (max 40,000 characters)');
      }

      // Validate and parse platforms
      let platforms = [];
      if (!record.platforms || record.platforms.trim() === '') {
        errors.push('At least one platform is required');
      } else {
        platforms = record.platforms.toLowerCase().split(',').map(p => p.trim()).filter(p => p);
        const invalidPlatforms = platforms.filter(p => !VALID_PLATFORMS.includes(p));
        if (invalidPlatforms.length > 0) {
          errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}. Valid: ${VALID_PLATFORMS.join(', ')}`);
        }
        if (platforms.length === 0) {
          errors.push('At least one valid platform is required');
        }
      }

      // Validate image_url (optional)
      let imageUrl = record.image_url ? record.image_url.trim() : '';
      if (imageUrl && !isValidUrl(imageUrl)) {
        errors.push(`Invalid image URL: "${imageUrl}"`);
      }

      // Validate Reddit-specific fields
      if (platforms.includes('reddit')) {
        if (!record.reddit_title || record.reddit_title.trim() === '') {
          errors.push('Reddit title is required when posting to Reddit');
        } else if (record.reddit_title.length > 300) {
          errors.push('Reddit title is too long (max 300 characters)');
        }

        if (!record.reddit_subreddit || record.reddit_subreddit.trim() === '') {
          errors.push('Reddit subreddit is required when posting to Reddit');
        }
      }

      // Platform-specific character limits
      const PLATFORM_LIMITS = {
        twitter: 280,
        linkedin: 3000,
        tiktok: 2200,
        youtube: 5000,
        reddit: 40000
      };

      const captionLength = record.caption ? record.caption.length : 0;
      const exceededPlatforms = platforms.filter(platform => {
        const limit = PLATFORM_LIMITS[platform];
        return limit && captionLength > limit;
      });

      if (exceededPlatforms.length > 0) {
        warnings.push(`Caption exceeds character limit for: ${exceededPlatforms.join(', ')}`);
      }

      return {
        rowNumber,
        originalData: record,
        parsed: {
          schedule_datetime: scheduleDate,
          caption: record.caption ? record.caption.trim() : '',
          platforms,
          image_url: imageUrl,
          reddit_title: record.reddit_title ? record.reddit_title.trim() : '',
          reddit_subreddit: record.reddit_subreddit ? record.reddit_subreddit.trim() : ''
        },
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

/**
 * Parse datetime string in various formats
 * Accepts: "YYYY-MM-DD HH:MM", "YYYY-MM-DDTHH:MM:SS", ISO format
 */
function parseDatetime(datetimeStr) {
  try {
    // Try ISO format first
    let date = new Date(datetimeStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try "YYYY-MM-DD HH:MM" format
    const match = datetimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      date = new Date(year, month - 1, day, hour, minute);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate a sample CSV template
 */
function generateTemplate() {
  const headers = 'schedule_datetime,caption,platforms,image_url,reddit_title,reddit_subreddit';
  const example1 = '2025-11-10 14:30,"Excited to share our new product launch! 🚀 #ProductLaunch #Innovation","linkedin,twitter","https://example.com/image.jpg","",""';
  const example2 = '2025-11-11 09:00,"Check out this amazing guide on social media marketing","reddit","","The Ultimate Social Media Marketing Guide","marketing"';
  const example3 = '2025-11-12 16:00,"Check out our latest blog post on social media tips","linkedin,twitter","","",""';
  
  return [headers, example1, example2, example3].join('\n');
}

/**
 * Get validation summary statistics
 */
function getValidationSummary(parsedData) {
  const total = parsedData.length;
  const valid = parsedData.filter(row => row.isValid).length;
  const invalid = total - valid;
  const withWarnings = parsedData.filter(row => row.warnings.length > 0).length;

  return {
    total,
    valid,
    invalid,
    withWarnings,
    validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0
  };
}

module.exports = {
  parseCSV,
  generateTemplate,
  getValidationSummary,
  VALID_PLATFORMS
};

