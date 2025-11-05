/**
 * Analytics Service
 * Advanced analytics and insights
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Analyze best times to post based on user's historical data
 * @param {string} userId - User ID
 * @returns {Promise<object>} Best times analysis
 */
async function analyzeBestTimes(userId) {
  try {
    // Get user's post history from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('created_at, schedule_time, status, platforms')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .in('status', ['posted', 'partial']); // Only successful posts
    
    if (error) throw error;
    
    if (!posts || posts.length < 5) {
      // Not enough data for analysis
      return {
        hasEnoughData: false,
        totalPosts: posts?.length || 0,
        message: 'Need at least 5 posts for analysis'
      };
    }
    
    // Group by hour and day of week
    const timeSlots = {};
    
    posts.forEach(post => {
      const date = new Date(post.created_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const key = `${dayOfWeek}-${hour}`;
      
      if (!timeSlots[key]) {
        timeSlots[key] = {
          dayOfWeek,
          hour,
          count: 0,
          successful: 0
        };
      }
      
      timeSlots[key].count++;
      if (post.status === 'posted') {
        timeSlots[key].successful++;
      }
    });
    
    // Calculate success rates
    Object.keys(timeSlots).forEach(key => {
      const slot = timeSlots[key];
      slot.successRate = slot.count > 0 ? (slot.successful / slot.count) * 100 : 0;
    });
    
    // Get top 5 time slots
    const topSlots = Object.values(timeSlots)
      .sort((a, b) => {
        // Sort by success rate first, then by count
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        return b.count - a.count;
      })
      .slice(0, 5)
      .map(slot => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek],
        dayOfWeek: slot.dayOfWeek,
        hour: slot.hour,
        time: `${slot.hour % 12 || 12}:00 ${slot.hour >= 12 ? 'PM' : 'AM'}`,
        successRate: Math.round(slot.successRate),
        totalPosts: slot.count,
        successful: slot.successful
      }));
    
    return {
      hasEnoughData: true,
      totalPosts: posts.length,
      topSlots,
      periodDays: 90
    };
    
  } catch (error) {
    console.error('❌ Error analyzing best times:', error);
    throw error;
  }
}

/**
 * Get heatmap data for posting times
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Heatmap data (hour x day)
 */
async function getPostingHeatmap(userId) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('created_at, status')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    // Initialize heatmap (7 days x 24 hours)
    const heatmap = Array.from({ length: 7 }, (_, day) => 
      Array.from({ length: 24 }, (_, hour) => ({
        day,
        hour,
        count: 0,
        successful: 0
      }))
    );
    
    // Fill heatmap with data
    posts.forEach(post => {
      const date = new Date(post.created_at);
      const day = date.getDay();
      const hour = date.getHours();
      
      heatmap[day][hour].count++;
      if (post.status === 'posted') {
        heatmap[day][hour].successful++;
      }
    });
    
    // Flatten and add success rates
    const flatHeatmap = [];
    heatmap.forEach((dayData, day) => {
      dayData.forEach((hourData, hour) => {
        flatHeatmap.push({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
          dayIndex: day,
          hour: hour,
          time: `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`,
          count: hourData.count,
          successful: hourData.successful,
          successRate: hourData.count > 0 ? Math.round((hourData.successful / hourData.count) * 100) : 0
        });
      });
    });
    
    return flatHeatmap;
    
  } catch (error) {
    console.error('❌ Error getting heatmap:', error);
    throw error;
  }
}

module.exports = {
  analyzeBestTimes,
  getPostingHeatmap
};

