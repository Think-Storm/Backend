/*
  Warnings:

  - The primary key for the `DomainLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DomainLabel` table. All the data in the column will be lost.
  - The primary key for the `ProjectDomainLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `label_id` on the `ProjectDomainLabel` table. All the data in the column will be lost.
  - The primary key for the `ProjectTechnicalLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `label_id` on the `ProjectTechnicalLabel` table. All the data in the column will be lost.
  - The primary key for the `TechnicalLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TechnicalLabel` table. All the data in the column will be lost.
  - The primary key for the `UserProfileDomainLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `label_id` on the `UserProfileDomainLabel` table. All the data in the column will be lost.
  - The primary key for the `UserProfileTechnicalLabel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `label_id` on the `UserProfileTechnicalLabel` table. All the data in the column will be lost.
  - Added the required column `label_name` to the `ProjectDomainLabel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label_name` to the `ProjectTechnicalLabel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label_name` to the `UserProfileDomainLabel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label_name` to the `UserProfileTechnicalLabel` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectDomainLabel" DROP CONSTRAINT "ProjectDomainLabel_label_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTechnicalLabel" DROP CONSTRAINT "ProjectTechnicalLabel_label_id_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileDomainLabel" DROP CONSTRAINT "UserProfileDomainLabel_label_id_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileTechnicalLabel" DROP CONSTRAINT "UserProfileTechnicalLabel_label_id_fkey";

-- AlterTable
ALTER TABLE "DomainLabel" DROP CONSTRAINT "DomainLabel_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "DomainLabel_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "ProjectDomainLabel" DROP CONSTRAINT "ProjectDomainLabel_pkey",
DROP COLUMN "label_id",
ADD COLUMN     "label_name" TEXT NOT NULL,
ADD CONSTRAINT "ProjectDomainLabel_pkey" PRIMARY KEY ("project_id", "label_name");

-- AlterTable
ALTER TABLE "ProjectTechnicalLabel" DROP CONSTRAINT "ProjectTechnicalLabel_pkey",
DROP COLUMN "label_id",
ADD COLUMN     "label_name" TEXT NOT NULL,
ADD CONSTRAINT "ProjectTechnicalLabel_pkey" PRIMARY KEY ("project_id", "label_name");

-- AlterTable
ALTER TABLE "TechnicalLabel" DROP CONSTRAINT "TechnicalLabel_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TechnicalLabel_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "UserProfileDomainLabel" DROP CONSTRAINT "UserProfileDomainLabel_pkey",
DROP COLUMN "label_id",
ADD COLUMN     "label_name" TEXT NOT NULL,
ADD CONSTRAINT "UserProfileDomainLabel_pkey" PRIMARY KEY ("user_id", "label_name");

-- AlterTable
ALTER TABLE "UserProfileTechnicalLabel" DROP CONSTRAINT "UserProfileTechnicalLabel_pkey",
DROP COLUMN "label_id",
ADD COLUMN     "label_name" TEXT NOT NULL,
ADD CONSTRAINT "UserProfileTechnicalLabel_pkey" PRIMARY KEY ("user_id", "label_name");

-- AddForeignKey
ALTER TABLE "UserProfileDomainLabel" ADD CONSTRAINT "UserProfileDomainLabel_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "DomainLabel"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileTechnicalLabel" ADD CONSTRAINT "UserProfileTechnicalLabel_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "TechnicalLabel"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDomainLabel" ADD CONSTRAINT "ProjectDomainLabel_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "DomainLabel"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnicalLabel" ADD CONSTRAINT "ProjectTechnicalLabel_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "TechnicalLabel"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
