/**
 * Smart Scheduling Service
 * Provides optimal posting times for different platforms based on day of week
 */

/**
 * Get optimal posting times for a platform on a specific day
 * @param {string} platform - Platform name (linkedin, twitter, etc.)
 * @param {number} dayOfWeek - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns {number[]} Array of optimal hours (0-23)
 */
function getOptimalTimes(platform, dayOfWeek) {
  const times = {
    linkedin: {
      1: [9, 12, 17],    // Monday: 9am, 12pm, 5pm
      2: [9, 13],        // Tuesday: 9am, 1pm
      3: [10, 14],       // Wednesday: 10am, 2pm
      4: [9, 15],        // Thursday: 9am, 3pm
      5: [9, 11],        // Friday: 9am, 11am
      6: [10],           // Saturday: 10am
      0: []              // Sunday: none (low engagement)
    },
    twitter: {
      1: [8, 12, 17, 20],
      2: [8, 13, 18],
      3: [9, 14, 19],
      4: [8, 15, 20],
      5: [9, 12, 17],
      6: [10, 15],
      0: [11, 16]
    },
    tiktok: {
      1: [12, 18, 21],
      2: [11, 17, 20],
      3: [12, 18, 21],
      4: [11, 17, 20],
      5: [12, 18, 21],
      6: [10, 15, 19],
      0: [11, 16, 20]
    },
    youtube: {
      1: [14, 18],
      2: [15, 19],
      3: [14, 18],
      4: [15, 19],
      5: [14, 17],
      6: [12, 16],
      0: [13, 17]
    },
    reddit: {
      1: [8, 13, 18],
      2: [9, 14],
      3: [8, 13, 19],
      4: [9, 14, 18],
      5: [8, 12, 17],
      6: [10, 15],
      0: [11, 16]
    },
    telegram: {
      1: [8, 12, 18],
      2: [9, 13, 19],
      3: [8, 14, 18],
      4: [9, 13, 19],
      5: [8, 12, 17],
      6: [10, 15],
      0: [11, 16]
    },
    discord: {
      1: [19, 21],
      2: [18, 20],
      3: [19, 21],
      4: [18, 20],
      5: [19, 22],
      6: [18, 21],
      0: [17, 20]
    },
    slack: {
      1: [9, 13, 17],
      2: [9, 14],
      3: [10, 15],
      4: [9, 14, 17],
      5: [9, 12],
      6: [],
      0: []
    },
    pinterest: {
      1: [14, 20],
      2: [13, 19],
      3: [14, 20],
      4: [13, 19],
      5: [14, 18],
      6: [12, 17],
      0: [13, 18]
    },
    medium: {
      1: [8, 12],
      2: [9, 13],
      3: [8, 12],
      4: [9, 13],
      5: [8, 11],
      6: [10],
      0: [11]
    },
    mastodon: {
      1: [9, 13, 18],
      2: [9, 14],
      3: [10, 15],
      4: [9, 14, 18],
      5: [9, 12],
      6: [10, 15],
      0: [11, 16]
    },
    bluesky: {
      1: [9, 13, 18],
      2: [9, 14],
      3: [10, 15],
      4: [9, 14, 18],
      5: [9, 12],
      6: [10, 15],
      0: [11, 16]
    }
  };

  return times[platform]?.[dayOfWeek] || [10, 14, 18]; // Default times if not found
}

/**
 * Get optimal posting time for a specific platform and date
 * @param {string} platform - Platform name
 * @param {Date} date - Target date
 * @returns {Date} Date object with optimal time set
 */
function getOptimalPostTime(platform, date) {
  const dayOfWeek = date.getDay();
  const optimalHours = getOptimalTimes(platform, dayOfWeek);
  
  // If no optimal times for this day, use default
  if (optimalHours.length === 0) {
    optimalHours.push(10, 14, 18);
  }
  
  // Pick a random optimal hour
  const randomHour = optimalHours[Math.floor(Math.random() * optimalHours.length)];
  
  const optimalDate = new Date(date);
  optimalDate.setHours(randomHour, Math.floor(Math.random() * 60), 0, 0);
  
  return optimalDate;
}

/**
 * Generate schedule times for multiple posts with smart scheduling
 * @param {number} count - Number of posts
 * @param {string} mode - Schedule mode ('weekly', 'daily', etc.)
 * @param {string[]} platforms - Array of platform names
 * @param {number} weekOffset - Week offset: 0 = current week, 1 = next week (days 8-14)
 * @returns {Date[]} Array of scheduled dates
 */
function generateSmartScheduleTimes(count, mode, platforms = [], weekOffset = 0) {
  const times = [];
  const now = new Date();
  
  if (mode === 'weekly') {
    // Weekly mode: One post per platform per day for 7 days
    // weekOffset 0 = current week (tomorrow + 0 days = tomorrow)
    // weekOffset 1 = next week (tomorrow + 7 days = next week)
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 1 + (weekOffset * 7)); // Tomorrow + weekOffset weeks
    startDate.setHours(0, 0, 0, 0);
    
    for (let day = 0; day < 7; day++) {
      for (let platformIndex = 0; platformIndex < platforms.length && times.length < count; platformIndex++) {
        const postDate = new Date(startDate);
        postDate.setDate(startDate.getDate() + day);
        
        // Use smart scheduling for this platform and day
        const platform = platforms[platformIndex];
        const optimalTime = getOptimalPostTime(platform, postDate);
        
        if (optimalTime > now) {
          times.push(optimalTime);
        } else {
          // If time is in the past, add 1 hour
          optimalTime.setHours(optimalTime.getHours() + 1);
          times.push(optimalTime);
        }
      }
    }
    
    times.sort((a, b) => a.getTime() - b.getTime());
  } else {
    // Daily mode: Spread throughout today
    const startHour = 8;
    const endHour = 20;
    const totalMinutes = (endHour - startHour) * 60;
    const interval = count > 1 ? totalMinutes / (count - 1) : totalMinutes;
    
    const today = new Date(now);
    today.setSeconds(0);
    today.setMilliseconds(0);
    
    const currentHour = today.getHours();
    const startTime = currentHour >= startHour 
      ? new Date(today.getTime() + 60 * 60 * 1000) // Next hour
      : new Date(today);
    
    if (currentHour < startHour) {
      startTime.setHours(startHour, 0, 0, 0);
    } else {
      startTime.setMinutes(0, 0, 0);
    }
    
    for (let i = 0; i < count; i++) {
      const minutesToAdd = Math.floor(i * interval);
      const postTime = new Date(startTime);
      postTime.setMinutes(postTime.getMinutes() + minutesToAdd);
      
      if (postTime.getHours() >= endHour) {
        postTime.setHours(endHour - 1, 59, 0, 0);
      }
      
      // Add small jitter
      const jitter = Math.floor(Math.random() * 30) - 15;
      postTime.setMinutes(postTime.getMinutes() + jitter);
      
      if (postTime > now) {
        times.push(postTime);
      } else {
        postTime.setHours(postTime.getHours() + 1);
        times.push(postTime);
      }
    }
  }
  
  return times;
}

module.exports = {
  getOptimalTimes,
  getOptimalPostTime,
  generateSmartScheduleTimes
};

