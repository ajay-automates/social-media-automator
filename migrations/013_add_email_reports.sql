-- Migration: Add Email Reports Support
-- Description: Add columns for email report preferences to users table
-- Date: 2025-11-05

-- ============================================
-- 1. Add email report columns to users table
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_reports_enabled BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS report_email TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'weekly';

-- ============================================
-- 2. Create index for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email_reports 
ON users(email_reports_enabled) WHERE email_reports_enabled = true;

-- ============================================
-- 3. Add comments
-- ============================================

COMMENT ON COLUMN users.email_reports_enabled IS 'Whether user has enabled weekly email reports';
COMMENT ON COLUMN users.report_email IS 'Email address for reports (defaults to user email if not set)';
COMMENT ON COLUMN users.report_frequency IS 'Frequency of reports: weekly, biweekly, or monthly';

-- ============================================
-- Migration Complete
-- ============================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Email reports migration completed successfully!';
  RAISE NOTICE '📧 Users can now enable/disable email reports';
  RAISE NOTICE '📈 Index created for performance';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Configure email service (SMTP/SendGrid/Gmail)';
  RAISE NOTICE '   2. Add EMAIL_USER and EMAIL_PASSWORD to .env';
  RAISE NOTICE '   3. Test with /api/reports/test-email endpoint';
  RAISE NOTICE '   4. Enable cron job in scheduler.js';
END $$;

