-- CreateEnum
CREATE TYPE "USER_STATUS" AS ENUM ('PENDING', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "AUTH_PROVIDER_NAME" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB', 'TWITTER', 'EMAIL');

-- CreateEnum
CREATE TYPE "EMAIL_VERIFICATION_ACTION_TYPE" AS ENUM ('REGISTER', 'RESETPASSWORD', 'DELETEACCOUNT');

-- CreateEnum
CREATE TYPE "POLICY_TYPE" AS ENUM ('PRIVATE', 'TERMOFSERVICES', 'EMAILMARKETING', 'COOKIEPOLICY');

-- CreateEnum
CREATE TYPE "USER_ACTIVITY_LOG_ACTION_TYPE" AS ENUM ('LOGIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(70),
    "phone_number" VARCHAR(20),
    "bio" TEXT,
    "username" VARCHAR(50),
    "password" VARCHAR(60),
    "email" VARCHAR(50) NOT NULL,
    "imageUrl" VARCHAR(255),
    "status" "USER_STATUS" NOT NULL,
    "latest_login_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "auth_provider" "AUTH_PROVIDER_NAME" NOT NULL,
    "provider_user_id" VARCHAR(50) NOT NULL,
    "provider_email" VARCHAR(50) NOT NULL,
    "linked_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "token" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "EMAIL_VERIFICATION_ACTION_TYPE" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "type" "POLICY_TYPE" NOT NULL,
    "content" TEXT NOT NULL,
    "version" VARCHAR(5) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_policies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "agreed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_log" (
    "id" UUID NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL,
    "ip_address" VARCHAR(50),
    "location" VARCHAR(50),
    "user_agent" VARCHAR(50),
    "status" INTEGER NOT NULL,
    "action" "USER_ACTIVITY_LOG_ACTION_TYPE" NOT NULL,
    "failure_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_deletion_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_deletion_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "device_name" VARCHAR(50),
    "ip_address" VARCHAR(50),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "username_change_histories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "previous_username" VARCHAR(50),
    "updated_username" VARCHAR(50) NOT NULL,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "username_change_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forbidden_usernames" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forbidden_usernames_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_providers_provider_user_id_key" ON "auth_providers"("provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_policies_user_id_policy_id_key" ON "user_policies"("user_id", "policy_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_sessions_user_id_device_id_key" ON "user_devices_sessions"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "forbidden_usernames_username_key" ON "forbidden_usernames"("username");

-- AddForeignKey
ALTER TABLE "auth_providers" ADD CONSTRAINT "auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policies" ADD CONSTRAINT "user_policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policies" ADD CONSTRAINT "user_policies_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_deletion_feedback" ADD CONSTRAINT "user_deletion_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices_sessions" ADD CONSTRAINT "user_devices_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "username_change_histories" ADD CONSTRAINT "username_change_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
