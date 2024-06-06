/*
  Warnings:

  - You are about to drop the column `languageCode` on the `projects` table. All the data in the column will be lost.
  - Added the required column `language_code` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_languageCode_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "languageCode",
ADD COLUMN     "language_code" "LanguageCode" NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
