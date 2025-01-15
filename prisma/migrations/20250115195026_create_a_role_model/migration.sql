/*
  Warnings:

  - You are about to drop the column `role` on the `involvements` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `join_requests` table. All the data in the column will be lost.
  - Added the required column `role_name` to the `involvements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_name` to the `join_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_name` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "involvements" DROP COLUMN "role",
ADD COLUMN     "role_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "join_requests" DROP COLUMN "role",
ADD COLUMN     "role_name" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "roles" (
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_prefered_role_fkey" FOREIGN KEY ("prefered_role") REFERENCES "roles"("name") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvements" ADD CONSTRAINT "involvements_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

