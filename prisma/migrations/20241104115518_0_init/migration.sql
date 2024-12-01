-- CreateEnum
CREATE TYPE "USER_STATUS" AS ENUM ('PENDING', 'ACTIVATED');

-- CreateEnum
CREATE TYPE "AUTH_PROVIDER_NAME" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB', 'TWITTER', 'EMAIL');

-- CreateEnum
CREATE TYPE "ACTION_TYPE" AS ENUM ('REGISTER', 'RESETPASSWORD');

-- CreateEnum
CREATE TYPE "POLICY_TYPE" AS ENUM ('PRIVATE', 'TERMOFSERVICES');

-- CreateEnum
CREATE TYPE "LOGIN_STATUS" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50),
    "phone_number" VARCHAR(20),
    "bio" TEXT,
    "username" VARCHAR(50),
    "password" VARCHAR(60),
    "email" VARCHAR(50) NOT NULL,
    "imageUrl" VARCHAR(255),
    "status" "USER_STATUS" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "type" "ACTION_TYPE" NOT NULL,
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
    "agreed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_histories" (
    "id" UUID NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "login_time" TIMESTAMP(3) NOT NULL,
    "ip_address" VARCHAR(50) NOT NULL,
    "location" VARCHAR(50),
    "user_agent" VARCHAR(50),
    "status" "LOGIN_STATUS" NOT NULL,
    "failure_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_login_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_providers_provider_user_id_key" ON "auth_providers"("provider_user_id");

-- AddForeignKey
ALTER TABLE "auth_providers" ADD CONSTRAINT "auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policies" ADD CONSTRAINT "user_policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policies" ADD CONSTRAINT "user_policies_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
