/*
  Warnings:

  - You are about to drop the column `userProfileId` on the `DomainLabel` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileId` on the `TechnicalLabel` table. All the data in the column will be lost.
  - You are about to drop the column `labels` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DomainLabel" DROP CONSTRAINT "DomainLabel_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "TechnicalLabel" DROP CONSTRAINT "TechnicalLabel_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_fkey";

-- AlterTable
ALTER TABLE "DomainLabel" DROP COLUMN "userProfileId";

-- AlterTable
ALTER TABLE "TechnicalLabel" DROP COLUMN "userProfileId";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "labels";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "location" TEXT,
ADD COLUMN     "prefered_role" TEXT,
ADD COLUMN     "website" TEXT;

-- DropTable
DROP TABLE "user_profiles";
