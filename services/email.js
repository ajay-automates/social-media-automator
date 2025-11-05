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

module.exports = {
  sendWeeklyReport,
  sendTestEmail
};

