-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LanguageCode" ADD VALUE 'ES';
ALTER TYPE "LanguageCode" ADD VALUE 'DE';
ALTER TYPE "LanguageCode" ADD VALUE 'IT';
ALTER TYPE "LanguageCode" ADD VALUE 'JA';
ALTER TYPE "LanguageCode" ADD VALUE 'ZH';
ALTER TYPE "LanguageCode" ADD VALUE 'RU';
ALTER TYPE "LanguageCode" ADD VALUE 'AR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LanguageName" ADD VALUE 'Spanish';
ALTER TYPE "LanguageName" ADD VALUE 'German';
ALTER TYPE "LanguageName" ADD VALUE 'Italian';
ALTER TYPE "LanguageName" ADD VALUE 'Japanese';
ALTER TYPE "LanguageName" ADD VALUE 'Chinese';
ALTER TYPE "LanguageName" ADD VALUE 'Russian';
ALTER TYPE "LanguageName" ADD VALUE 'Arabic';
