/*
  Warnings:

  - The primary key for the `languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `language_code` on the `projects` table. All the data in the column will be lost.
  - The primary key for the `user_profile_languages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `language_code` on the `user_profile_languages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `languages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `language_name` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language_name` to the `user_profile_languages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_language_code_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_language_code_fkey";

-- AlterTable
ALTER TABLE "languages" DROP CONSTRAINT "languages_pkey",
ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "language_code",
ADD COLUMN     "language_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_pkey",
DROP COLUMN "language_code",
ADD COLUMN     "language_name" TEXT NOT NULL,
ADD CONSTRAINT "user_profile_languages_pkey" PRIMARY KEY ("user_id", "language_name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_language_name_fkey" FOREIGN KEY ("language_name") REFERENCES "languages"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_language_name_fkey" FOREIGN KEY ("language_name") REFERENCES "languages"("name") ON DELETE CASCADE ON UPDATE CASCADE;
