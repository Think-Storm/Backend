/*
  Warnings:

  - The `status` column on the `join_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_profile_languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `code` on the `languages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `languages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `goal` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `language_code` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `language_code` on the `user_profile_languages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_language_code_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_language_code_fkey";

-- AlterTable
ALTER TABLE "join_requests" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "languages" DROP CONSTRAINT "languages_pkey",
DROP COLUMN "code",
ADD COLUMN     "code" TEXT NOT NULL,
DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL,
ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "goal",
ADD COLUMN     "goal" TEXT NOT NULL,
DROP COLUMN "language_code",
ADD COLUMN     "language_code" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_pkey",
DROP COLUMN "language_code",
ADD COLUMN     "language_code" TEXT NOT NULL,
ADD CONSTRAINT "user_profile_languages_pkey" PRIMARY KEY ("user_id", "language_code");

-- DropEnum
DROP TYPE "Goal";

-- DropEnum
DROP TYPE "JoinRequestStatus";

-- DropEnum
DROP TYPE "LanguageCode";

-- DropEnum
DROP TYPE "LanguageName";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "ProjectStatus";

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
