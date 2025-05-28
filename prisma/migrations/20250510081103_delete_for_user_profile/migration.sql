-- DropForeignKey
ALTER TABLE "user_profile_domain_labels" DROP CONSTRAINT "user_profile_domain_labels_label_name_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_domain_labels" DROP CONSTRAINT "user_profile_domain_labels_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_language_code_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_languages" DROP CONSTRAINT "user_profile_languages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_technical_labels" DROP CONSTRAINT "user_profile_technical_labels_label_name_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_technical_labels" DROP CONSTRAINT "user_profile_technical_labels_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_fkey";

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_labels" ADD CONSTRAINT "user_profile_domain_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_labels" ADD CONSTRAINT "user_profile_domain_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_labels" ADD CONSTRAINT "user_profile_technical_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_labels" ADD CONSTRAINT "user_profile_technical_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
