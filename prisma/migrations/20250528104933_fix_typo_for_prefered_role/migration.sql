-- DropForeignKey
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_user_id_fkey";

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
