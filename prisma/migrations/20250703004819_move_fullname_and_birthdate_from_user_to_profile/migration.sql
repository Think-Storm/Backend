/*
  Warnings:

  - You are about to drop the column `birthdate` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "birthdate" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "birthdate",
DROP COLUMN "full_name";
