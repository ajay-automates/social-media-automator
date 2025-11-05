/**
 * Reports Service
 * Generates analytics reports for email
 */

const { createClient } = require('@supabase/supabase-js');
const { sendWeeklyReport } = require('./email');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate weekly report data for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Report data
 */
async function generateWeeklyReport(userId) {
  try {
    // Get date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Get posts from last 7 days
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (error) throw error;
    
    // Calculate metrics
    const totalPosts = posts?.length || 0;
    const successfulPosts = posts?.filter(p => p.status === 'posted').length || 0;
    const failedPosts = posts?.filter(p => p.status === 'failed').length || 0;
    const successRate = totalPosts > 0 ? Math.round((successfulPosts / totalPosts) * 100) : 0;
    
    // Get platform distribution
    const platformCounts = {};
    posts?.forEach(post => {
      if (Array.isArray(post.platforms)) {
        post.platforms.forEach(platform => {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
      }
    });
    
    // Find top platform
    let topPlatform = 'N/A';
    let maxCount = 0;
    Object.entries(platformCounts).forEach(([platform, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
      }
    });
    
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('email, metadata')
      .eq('id', userId)
      .single();
    
    const userName = userData?.metadata?.name || userData?.email?.split('@')[0] || 'there';
    
    return {
      userName,
      userEmail: userData?.email,
      totalPosts,
      successfulPosts,
      failedPosts,
      successRate,
      topPlatform,
      platformCounts,
      weekStart: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEnd: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dashboardUrl: process.env.DASHBOARD_URL || 'https://socialmediaautomator.com'
    };
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  }
}

/**
 * Send report to a specific user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function sendReportToUser(userId) {
  try {
    // Check if user has email reports enabled
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, email_reports_enabled, report_email')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    if (!user.email_reports_enabled) {
      console.log(`ℹ️  User ${userId} has email reports disabled, skipping`);
      return false;
    }
    
    const reportEmail = user.report_email || user.email;
    if (!reportEmail) {
      console.log(`⚠️  User ${userId} has no email address, skipping`);
      return false;
    }
    
    // Generate report
    const reportData = await generateWeeklyReport(userId);
    
    // Send email
    await sendWeeklyReport(reportEmail, reportData);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error sending report to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send weekly reports to all users who have them enabled
 * Called by cron job
 * @returns {Promise<object>} Summary of sends
 */
async function sendWeeklyReportsToAll() {
  try {
    console.log('\n📧 Starting weekly report send to all users...');
    
    // Get all users with email reports enabled
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email_reports_enabled', true);
    
    if (error) throw error;
    
    if (!users || users.length === 0) {
      console.log('ℹ️  No users with email reports enabled');
      return { sent: 0, failed: 0 };
    }
    
    console.log(`📬 Sending reports to ${users.length} users...`);
    
    let sent = 0;
    let failed = 0;
    
    for (const user of users) {
      const success = await sendReportToUser(user.id);
      if (success) {
        sent++;
      } else {
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Weekly reports complete: ${sent} sent, ${failed} failed\n`);
    
    return { sent, failed, total: users.length };
    
  } catch (error) {
    console.error('❌ Error in sendWeeklyReportsToAll:', error);
    throw error;
  }
}

module.exports = {
  generateWeeklyReport,
  sendReportToUser,
  sendWeeklyReportsToAll
};

