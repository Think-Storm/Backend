/*
  Warnings:

  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `prefered_role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `UserDomainLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTechnicalLabel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserDomainLabel" DROP CONSTRAINT "UserDomainLabel_label_id_fkey";

-- DropForeignKey
ALTER TABLE "UserDomainLabel" DROP CONSTRAINT "UserDomainLabel_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserTechnicalLabel" DROP CONSTRAINT "UserTechnicalLabel_label_id_fkey";

-- DropForeignKey
ALTER TABLE "UserTechnicalLabel" DROP CONSTRAINT "UserTechnicalLabel_user_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar",
DROP COLUMN "bio",
DROP COLUMN "location",
DROP COLUMN "prefered_role",
DROP COLUMN "website";

-- DropTable
DROP TABLE "UserDomainLabel";

-- DropTable
DROP TABLE "UserTechnicalLabel";

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "prefered_role" TEXT,
    "location" TEXT,
    "website" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfileDomainLabel" (
    "user_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "UserProfileDomainLabel_pkey" PRIMARY KEY ("user_id","label_id")
);

-- CreateTable
CREATE TABLE "UserProfileTechnicalLabel" (
    "user_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "UserProfileTechnicalLabel_pkey" PRIMARY KEY ("user_id","label_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_user_id_key" ON "UserProfile"("user_id");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileDomainLabel" ADD CONSTRAINT "UserProfileDomainLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "DomainLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileDomainLabel" ADD CONSTRAINT "UserProfileDomainLabel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserProfile"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileTechnicalLabel" ADD CONSTRAINT "UserProfileTechnicalLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "TechnicalLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileTechnicalLabel" ADD CONSTRAINT "UserProfileTechnicalLabel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserProfile"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
