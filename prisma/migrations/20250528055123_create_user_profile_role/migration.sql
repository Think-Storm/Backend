/*
  Warnings:

  - You are about to drop the column `prefered_role` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_prefered_role_fkey";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "prefered_role";

-- CreateTable
CREATE TABLE "user_profile_roles" (
    "user_id" INTEGER NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "user_profile_roles_pkey" PRIMARY KEY ("user_id","role_name")
);

-- AddForeignKey
ALTER TABLE "user_profile_roles" ADD CONSTRAINT "user_profile_roles_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_roles" ADD CONSTRAINT "user_profile_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
