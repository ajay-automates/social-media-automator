/**
 * Email Service
 * Sends email reports and notifications
 */

const nodemailer = require('nodemailer');

// Create transporter (configure based on your email provider)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  
  // Configure based on environment variables
  // For Gmail: Use App Password (not regular password)
  // For SendGrid: Use API key
  const emailConfig = {
    gmail: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      }
    },
    sendgrid: {
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  };

  // Determine which config to use
  let config;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    config = emailConfig.gmail;
  } else if (process.env.SENDGRID_API_KEY) {
    config = emailConfig.sendgrid;
  } else if (process.env.SMTP_HOST) {
    config = emailConfig.smtp;
  } else {
    console.warn('⚠️  No email configuration found. Email reports disabled.');
    return null;
  }

  transporter = nodemailer.createTransporter(config);
  return transporter;
}

/**
 * Send weekly report email
 * @param {string} userEmail - Recipient email
 * @param {object} reportData - Report data
 * @returns {Promise<boolean>} Success status
 */
async function sendWeeklyReport(userEmail, reportData) {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping email send');
      return false;
    }

    const {
      userName = 'there',
      totalPosts = 0,
      successfulPosts = 0,
      failedPosts = 0,
      successRate = 0,
      topPlatform = 'N/A',
      weekStart,
      weekEnd,
      dashboardUrl = 'https://socialmediaautomator.com'
    } = reportData;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - Social Media Automator</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #9333ea); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">📊 Weekly Report</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Social Media Automator</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi ${userName},
              </p>
              <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Here's your social media performance summary for ${weekStart} - ${weekEnd}:
              </p>
            </td>
          </tr>

          <!-- Stats -->}
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #3b82f6; margin-bottom: 8px;">${totalPosts}</div>
                    <div style="font-size: 14px; color: #6b7280;">Total Posts</div>
                  </td>
                  <td width="8%"></td>
                  <td width="33%" style="padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 36px; font-weight: bold; color: #10b981; margin-bottom: 8px;">${successRate}%</div>
                    <div style="font-size: 14px; color: #6b7280;">Success Rate</div>
                  </td>
                  <td width="8%"></td>
                  <td width="33%" style="padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 8px;">${topPlatform}</div>
                    <div style="font-size: 14px; color: #6b7280;">Top Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <div style="background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px;">
                <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.8;">
                  <strong>Summary:</strong><br>
                  • ${successfulPosts} posts published successfully<br>
                  ${failedPosts > 0 ? `• ${failedPosts} posts failed (check your dashboard for details)<br>` : ''}
                  • Your most active platform was ${topPlatform}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                View Full Analytics Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                You're receiving this because you enabled weekly reports in Social Media Automator.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                <a href="${dashboardUrl}/settings" style="color: #9ca3af; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: userEmail,
      subject: `📊 Your Weekly Social Media Report (${weekStart} - ${weekEnd})`,
      html: htmlContent,
      text: `Weekly Report - Social Media Automator

Hi ${userName},

Here's your performance summary for ${weekStart} - ${weekEnd}:

📊 Total Posts: ${totalPosts}
✅ Success Rate: ${successRate}%
🌟 Top Platform: ${topPlatform}

Summary:
• ${successfulPosts} posts published successfully
${failedPosts > 0 ? `• ${failedPosts} posts failed\n` : ''}• Most active platform: ${topPlatform}

View full analytics: ${dashboardUrl}

---
You're receiving this because you enabled weekly reports.
Manage preferences: ${dashboardUrl}/settings
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Weekly report sent to ${userEmail}:`, info.messageId);
    
    return true;

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Send test email
 * @param {string} userEmail - Recipient email
 * @returns {Promise<boolean>} Success status
 */
async function sendTestEmail(userEmail) {
  try {
    const transport = getTransporter();
    if (!transport) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: userEmail,
      subject: '✅ Test Email - Social Media Automator',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h1 style="margin: 0 0 20px 0;">✅ Email Service Working!</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0;">
            Your email reports are configured correctly. You'll receive weekly reports every Monday morning.
          </p>
          <p style="font-size: 14px; margin-top: 30px; opacity: 0.9;">
            - Social Media Automator Team
          </p>
        </div>
      `,
      text: 'Email service is working! You will receive weekly reports every Monday.'
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ Test email sent to ${userEmail}`);
    
    return true;

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    throw error;
  }
}

/**
 * Send a generic email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of email
 */
async function sendEmail(to, subject, htmlContent) {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      throw new Error('Email not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send welcome email for new users
 * @param {string} userEmail - Recipient email
 * @param {object} options - Additional options
 * @returns {Promise<boolean>} Success status
 */
async function sendWelcomeEmail(userEmail, options = {}) {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping welcome email');
      return false;
    }

    const {
      userName = 'there',
      dashboardUrl = 'https://socialmediaautomator.com',
      tutorialUrl = 'https://socialmediaautomator.com/tutorial'
    } = options;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Social Media Automator</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #9333ea); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🚀 Welcome Aboard!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Social Media Automator</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi ${userName},
              </p>
              <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to Social Media Automator! We're excited to have you on board. Let's get you started with creating amazing social media content across multiple platforms.
              </p>
            </td>
          </tr>

          <!-- Quick Start Guide -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border-radius: 12px; padding: 24px;">
                <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">🎯 Quick Start Guide</h2>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <p style="margin: 0 0 12px 0;"><strong>1. Connect Your Accounts</strong><br>Link your LinkedIn, Twitter, Instagram, Facebook, and other social media accounts.</p>
                  <p style="margin: 0 0 12px 0;"><strong>2. Create Your First Post</strong><br>Use our intuitive editor to craft engaging content.</p>
                  <p style="margin: 0 0 12px 0;"><strong>3. Schedule & Publish</strong><br>Schedule posts for optimal times or publish instantly across all platforms.</p>
                  <p style="margin: 0;"><strong>4. Track Analytics</strong><br>Monitor performance and get insights to improve your content strategy.</p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; vertical-align: top;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🔗</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Multi-Platform Posting</div>
                    <div style="font-size: 13px; color: #6b7280;">Post to all your accounts at once</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; vertical-align: top;">
                    <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Smart Scheduling</div>
                    <div style="font-size: 13px; color: #6b7280;">Schedule posts for perfect timing</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Get Started Now →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Questions? Check out our <a href="${tutorialUrl}" style="color: #3b82f6; text-decoration: underline;">interactive tutorial</a> or contact our support team.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: userEmail,
      subject: '🚀 Welcome to Social Media Automator!',
      html: htmlContent,
      text: `Welcome to Social Media Automator!

Hi ${userName},

Welcome! We're excited to have you on board. Here's how to get started:

1. CONNECT YOUR ACCOUNTS
   Link your LinkedIn, Twitter, Instagram, Facebook, and other social media accounts.

2. CREATE YOUR FIRST POST
   Use our intuitive editor to craft engaging content.

3. SCHEDULE & PUBLISH
   Schedule posts for optimal times or publish instantly across all platforms.

4. TRACK ANALYTICS
   Monitor performance and get insights to improve your content strategy.

Get Started: ${dashboardUrl}

---
Questions? Check out our tutorial or contact our support team.
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${userEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send milestone celebration email
 * @param {string} userEmail - Recipient email
 * @param {string} milestoneType - Type of milestone
 * @param {object} options - Additional options
 * @returns {Promise<boolean>} Success status
 */
async function sendMilestoneEmail(userEmail, milestoneType, options = {}) {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping milestone email');
      return false;
    }

    const {
      userName = 'there',
      dashboardUrl = 'https://socialmediaautomator.com',
      postCount = 0
    } = options;

    // Define milestone details
    const milestoneDetails = {
      'first_account_connected': {
        emoji: '🎉',
        title: 'First Account Connected!',
        message: 'You\'ve successfully connected your first social media account. You\'re all set to start posting!',
        nextStep: 'Create your first post and watch the magic happen.'
      },
      'first_post_created': {
        emoji: '🚀',
        title: 'First Post Published!',
        message: 'Congratulations! Your first post has been published. This is just the beginning of your social media success!',
        nextStep: 'Create more posts and schedule them for optimal engagement.'
      },
      'posts_10': {
        emoji: '⭐',
        title: '10 Posts Published!',
        message: `You've reached a milestone! ${postCount} posts published across your platforms. Your content is reaching people!`,
        nextStep: 'Keep the momentum going and check your analytics to see what resonates.'
      },
      'posts_50': {
        emoji: '🏆',
        title: '50 Posts Published!',
        message: `Amazing! You've published ${postCount} posts. You're becoming a social media powerhouse!`,
        nextStep: 'Explore advanced features like scheduling and analytics to optimize your strategy.'
      },
      'posts_100': {
        emoji: '👑',
        title: '100 Posts Published!',
        message: `Incredible achievement! ${postCount} posts published. You're a content creation master!`,
        nextStep: 'Celebrate this win and leverage your experience to grow even further.'
      }
    };

    const milestone = milestoneDetails[milestoneType] || {
      emoji: '🎯',
      title: 'Milestone Reached!',
      message: 'You\'ve achieved a new milestone on your Social Media Automator journey!',
      nextStep: 'Keep up the great work!'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${milestone.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header with celebration -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #9333ea); padding: 60px 40px; text-align: center;">
              <div style="font-size: 80px; margin-bottom: 20px; animation: bounce 2s infinite;">${milestone.emoji}</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">${milestone.title}</h1>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi ${userName},
              </p>
              <p style="margin: 15px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${milestone.message}
              </p>
            </td>
          </tr>

          <!-- Celebration Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 12px; padding: 24px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.8;">
                  <strong>What's Next?</strong><br>
                  ${milestone.nextStep}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                View Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Keep crushing your social media goals! You're doing amazing.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: userEmail,
      subject: `${milestone.emoji} ${milestone.title}`,
      html: htmlContent,
      text: `${milestone.title}

Hi ${userName},

${milestone.message}

What's Next?
${milestone.nextStep}

View Dashboard: ${dashboardUrl}

---
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Milestone email sent to ${userEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending milestone email:', error);
    throw error;
  }
}

/**
 * Send post submission notification to workspace owner/admins
 * @param {string} ownerEmail - Owner/Admin email
 * @param {object} postData - Post details
 * @param {string} submitterName - Name of person who submitted
 * @param {string} dashboardUrl - Dashboard URL
 */
async function sendPostSubmissionNotification(ownerEmail, postData = {}, submitterName = 'A team member', dashboardUrl = 'https://socialmediaautomator.com') {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping post submission notification');
      return false;
    }

    const {
      postTitle = 'New post',
      platforms = [],
      submittedAt = new Date().toISOString()
    } = postData;

    const platformsList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
    const submissionTime = new Date(submittedAt).toLocaleString();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Submitted for Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #9333ea); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">📋 Post Pending Review</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">A team member submitted a post</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                <strong>${submitterName}</strong> has submitted a post for review.
              </p>
              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
                Submitted at: ${submissionTime}
              </p>
            </td>
          </tr>

          <!-- Post Details -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Post:</strong></p>
                <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px;">${postTitle.substring(0, 100)}${postTitle.length > 100 ? '...' : ''}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  <strong>Platforms:</strong> ${platformsList || 'Not specified'}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}/dashboard/posts/pending-approvals" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Review Post →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                You're receiving this because you're a workspace owner or admin.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: ownerEmail,
      subject: `📋 Post Pending Review - ${postTitle.substring(0, 50)}`,
      html: htmlContent,
      text: `Post Pending Review

${submitterName} submitted a post for review.

Post: ${postTitle}
Platforms: ${platformsList}
Submitted at: ${submissionTime}

Review the post and approve/reject it in your dashboard.
${dashboardUrl}/dashboard/posts/pending-approvals

---
You're receiving this because you're a workspace owner or admin.
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Post submission notification sent to ${ownerEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending post submission notification:', error);
    throw error;
  }
}

/**
 * Send post approval notification to post creator
 * @param {string} creatorEmail - Creator email
 * @param {object} postData - Post details
 * @param {string} approverName - Name of person who approved
 * @param {string} dashboardUrl - Dashboard URL
 */
async function sendPostApprovalNotification(creatorEmail, postData = {}, approverName = 'Workspace Admin', dashboardUrl = 'https://socialmediaautomator.com') {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping approval notification');
      return false;
    }

    const {
      postTitle = 'Your post',
      platforms = [],
      approvedAt = new Date().toISOString()
    } = postData;

    const platformsList = Array.isArray(platforms) ? platforms.join(', ') : platforms;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Approved!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">✅ Post Approved!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your post has been approved and scheduled</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Great news! <strong>${approverName}</strong> has approved your post and it's ready to go live.
              </p>
            </td>
          </tr>

          <!-- Post Details -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(16, 185, 129, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; border-left: 4px solid #10b981;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Post:</strong></p>
                <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px;">${postTitle.substring(0, 100)}${postTitle.length > 100 ? '...' : ''}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  <strong>Platforms:</strong> ${platformsList || 'Not specified'}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                View Dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Your post will be published according to the scheduled time.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: creatorEmail,
      subject: `✅ Post Approved - ${postTitle.substring(0, 50)}`,
      html: htmlContent,
      text: `Post Approved!

Great news! Your post has been approved by ${approverName}.

Post: ${postTitle}
Platforms: ${platformsList}

Your post is scheduled and ready to go live.

View Dashboard: ${dashboardUrl}/dashboard

---
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Approval notification sent to ${creatorEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending approval notification:', error);
    throw error;
  }
}

/**
 * Send post rejection notification to post creator
 * @param {string} creatorEmail - Creator email
 * @param {object} postData - Post details
 * @param {string} feedback - Rejection feedback
 * @param {string} rejecterName - Name of person who rejected
 * @param {string} dashboardUrl - Dashboard URL
 */
async function sendPostRejectionNotification(creatorEmail, postData = {}, feedback = '', rejecterName = 'Workspace Admin', dashboardUrl = 'https://socialmediaautomator.com') {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping rejection notification');
      return false;
    }

    const {
      postTitle = 'Your post',
      platforms = []
    } = postData;

    const platformsList = Array.isArray(platforms) ? platforms.join(', ') : platforms;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post Needs Revision</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">❌ Post Rejected</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Please review the feedback and revise</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Your post has been reviewed and needs revision. <strong>${rejecterName}</strong> has provided feedback below.
              </p>
            </td>
          </tr>

          <!-- Post Details -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background: rgba(239, 68, 68, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; border-left: 4px solid #ef4444;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Post:</strong></p>
                <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px;">${postTitle.substring(0, 100)}${postTitle.length > 100 ? '...' : ''}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  <strong>Platforms:</strong> ${platformsList || 'Not specified'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Feedback -->
          ${feedback ? `
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(0,0,0,0.05); border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Feedback:</strong></p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${feedback}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
            <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              View Post & Revise →
            </a>
          </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Please revise your post based on the feedback and resubmit for approval.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: creatorEmail,
      subject: `❌ Post Rejected - ${postTitle.substring(0, 50)}`,
      html: htmlContent,
      text: `Post Rejected

Your post has been reviewed and needs revision.

Post: ${postTitle}
Platforms: ${platformsList}

Feedback from ${rejecterName}:
${feedback || 'No specific feedback provided'}

Please revise your post and resubmit for approval.

View Post: ${dashboardUrl}/dashboard

---
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Rejection notification sent to ${creatorEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending rejection notification:', error);
    throw error;
  }
}

/**
 * Send changes requested notification to post creator
 * @param {string} creatorEmail - Creator email
 * @param {object} postData - Post details
 * @param {string} feedback - Requested changes
 * @param {string} requesterName - Name of person requesting changes
 * @param {string} dashboardUrl - Dashboard URL
 */
async function sendChangesRequestedNotification(creatorEmail, postData = {}, feedback = '', requesterName = 'Workspace Admin', dashboardUrl = 'https://socialmediaautomator.com') {
  try {
    const transport = getTransporter();
    if (!transport) {
      console.warn('Email service not configured, skipping changes requested notification');
      return false;
    }

    const {
      postTitle = 'Your post',
      platforms = []
    } = postData;

    const platformsList = Array.isArray(platforms) ? platforms.join(', ') : platforms;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Changes Requested on Your Post</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); backdrop-filter: blur(10px); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">📝 Changes Requested</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Review the requested changes and update your post</p>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                <strong>${requesterName}</strong> has requested some changes to your post. Please review the details below and make the necessary updates.
              </p>
            </td>
          </tr>

          <!-- Post Details -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <div style="background: rgba(245, 158, 11, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Post:</strong></p>
                <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px;">${postTitle.substring(0, 100)}${postTitle.length > 100 ? '...' : ''}</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  <strong>Platforms:</strong> ${platformsList || 'Not specified'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Feedback -->
          ${feedback ? `
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(0,0,0,0.05); border-radius: 12px; padding: 20px;">
                <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>Requested Changes:</strong></p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${feedback}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${dashboardUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #9333ea); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Update Post →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.05); text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Once you've made the changes, resubmit your post for approval.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © 2025 Social Media Automator. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Social Media Automator <noreply@socialmediaautomator.com>',
      to: creatorEmail,
      subject: `📝 Changes Requested - ${postTitle.substring(0, 50)}`,
      html: htmlContent,
      text: `Changes Requested

Changes have been requested on your post.

Post: ${postTitle}
Platforms: ${platformsList}

Requested Changes from ${requesterName}:
${feedback || 'No specific feedback provided'}

Please update your post and resubmit for approval.

Update Post: ${dashboardUrl}/dashboard

---
© 2025 Social Media Automator. All rights reserved.
      `
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Changes requested notification sent to ${creatorEmail}:`, info.messageId);

    return true;

  } catch (error) {
    console.error('❌ Error sending changes requested notification:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendWeeklyReport,
  sendTestEmail,
  sendWelcomeEmail,
  sendMilestoneEmail,
  sendPostSubmissionNotification,
  sendPostApprovalNotification,
  sendPostRejectionNotification,
  sendChangesRequestedNotification
};

