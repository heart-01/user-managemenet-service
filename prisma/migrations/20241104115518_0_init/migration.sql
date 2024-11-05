-- CreateEnum
CREATE TYPE "USER_STATUS" AS ENUM ('PENDING', 'ACTIVATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50),
    "phone_number" VARCHAR(20),
    "bio" TEXT,
    "username" VARCHAR(50),
    "password" VARCHAR(50),
    "email" VARCHAR(50) NOT NULL,
    "profile_image_url" VARCHAR(255),
    "status" "USER_STATUS" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
