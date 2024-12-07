/*
  Warnings:

  - You are about to drop the column `interests` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `user_profiles` table. All the data in the column will be lost.
  - Changed the type of `status` on the `projects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Complete', 'InProgress', 'OnHold', 'Canceled');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('Pending', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Developer', 'Designer', 'Manager', 'ProductOwner', 'ScrumMaster', 'Tester', 'DevOps', 'DataScientist', 'BusinessAnalyst', 'Marketing', 'Sales', 'CustomerSupport', 'HR', 'Finance', 'Legal', 'Other');

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "status",
ADD COLUMN     "status" "ProjectStatus" NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "interests",
DROP COLUMN "skills";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "TechnicalLabel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userProfileId" INTEGER,

    CONSTRAINT "TechnicalLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainLabel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userProfileId" INTEGER,

    CONSTRAINT "DomainLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDomainLabel" (
    "user_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "UserDomainLabel_pkey" PRIMARY KEY ("user_id","label_id")
);

-- CreateTable
CREATE TABLE "UserTechnicalLabel" (
    "user_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "UserTechnicalLabel_pkey" PRIMARY KEY ("user_id","label_id")
);

-- CreateTable
CREATE TABLE "ProjectDomainLabel" (
    "project_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectDomainLabel_pkey" PRIMARY KEY ("project_id","label_id")
);

-- CreateTable
CREATE TABLE "ProjectTechnicalLabel" (
    "project_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectTechnicalLabel_pkey" PRIMARY KEY ("project_id","label_id")
);

-- CreateTable
CREATE TABLE "Like" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "Involvement" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "Involvement_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "JoinRequest" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalLabel_name_key" ON "TechnicalLabel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DomainLabel_name_key" ON "DomainLabel"("name");

-- AddForeignKey
ALTER TABLE "TechnicalLabel" ADD CONSTRAINT "TechnicalLabel_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainLabel" ADD CONSTRAINT "DomainLabel_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDomainLabel" ADD CONSTRAINT "UserDomainLabel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDomainLabel" ADD CONSTRAINT "UserDomainLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "DomainLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechnicalLabel" ADD CONSTRAINT "UserTechnicalLabel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechnicalLabel" ADD CONSTRAINT "UserTechnicalLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "TechnicalLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDomainLabel" ADD CONSTRAINT "ProjectDomainLabel_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDomainLabel" ADD CONSTRAINT "ProjectDomainLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "DomainLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnicalLabel" ADD CONSTRAINT "ProjectTechnicalLabel_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTechnicalLabel" ADD CONSTRAINT "ProjectTechnicalLabel_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "TechnicalLabel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involvement" ADD CONSTRAINT "Involvement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involvement" ADD CONSTRAINT "Involvement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
