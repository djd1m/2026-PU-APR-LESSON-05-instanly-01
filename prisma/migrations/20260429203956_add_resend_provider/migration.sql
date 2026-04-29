-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "email_provider" TEXT NOT NULL DEFAULT 'smtp',
ADD COLUMN     "resend_api_key" TEXT,
ADD COLUMN     "resend_from_email" TEXT;
