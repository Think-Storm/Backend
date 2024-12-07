-- CreateTable
CREATE TABLE "user_profile_languages" (
    "user_id" INTEGER NOT NULL,
    "language_code" "LanguageCode" NOT NULL,

    CONSTRAINT "user_profile_languages_pkey" PRIMARY KEY ("user_id","language_code")
);

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_languages" ADD CONSTRAINT "user_profile_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
