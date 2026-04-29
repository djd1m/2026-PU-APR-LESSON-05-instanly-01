-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "openai_api_key" TEXT,
    "openai_model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "ai_max_tokens" INTEGER NOT NULL DEFAULT 500,
    "ai_temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "sending_start_hour" INTEGER NOT NULL DEFAULT 9,
    "sending_end_hour" INTEGER NOT NULL DEFAULT 18,
    "daily_limit_per_account" INTEGER NOT NULL DEFAULT 50,
    "default_smtp_host" TEXT,
    "default_smtp_port" INTEGER NOT NULL DEFAULT 587,
    "tracking_domain" TEXT,
    "auto_unsubscribe_link" BOOLEAN NOT NULL DEFAULT true,
    "sender_company_name" TEXT,
    "sender_contact_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
