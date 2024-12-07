/*
  Warnings:

  - You are about to drop the `DomainLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Involvement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JoinRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Like` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectDomainLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectTechnicalLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TechnicalLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfileDomainLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfileTechnicalLabel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Involvement" DROP CONSTRAINT "Involvement_project_id_fkey";

-- DropForeignKey
ALTER TABLE "Involvement" DROP CONSTRAINT "Involvement_user_id_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_project_id_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_project_id_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDomainLabel" DROP CONSTRAINT "ProjectDomainLabel_label_name_fkey";

-- DropForeignKey
ALTER TABLE "ProjectDomainLabel" DROP CONSTRAINT "ProjectDomainLabel_project_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTechnicalLabel" DROP CONSTRAINT "ProjectTechnicalLabel_label_name_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTechnicalLabel" DROP CONSTRAINT "ProjectTechnicalLabel_project_id_fkey";

-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileDomainLabel" DROP CONSTRAINT "UserProfileDomainLabel_label_name_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileDomainLabel" DROP CONSTRAINT "UserProfileDomainLabel_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileTechnicalLabel" DROP CONSTRAINT "UserProfileTechnicalLabel_label_name_fkey";

-- DropForeignKey
ALTER TABLE "UserProfileTechnicalLabel" DROP CONSTRAINT "UserProfileTechnicalLabel_user_id_fkey";

-- DropTable
DROP TABLE "DomainLabel";

-- DropTable
DROP TABLE "Involvement";

-- DropTable
DROP TABLE "JoinRequest";

-- DropTable
DROP TABLE "Like";

-- DropTable
DROP TABLE "ProjectDomainLabel";

-- DropTable
DROP TABLE "ProjectTechnicalLabel";

-- DropTable
DROP TABLE "TechnicalLabel";

-- DropTable
DROP TABLE "UserProfile";

-- DropTable
DROP TABLE "UserProfileDomainLabel";

-- DropTable
DROP TABLE "UserProfileTechnicalLabel";

-- CreateTable
CREATE TABLE "user_profile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "prefered_role" TEXT,
    "location" TEXT,
    "website" TEXT,

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_labels" (
    "name" TEXT NOT NULL,

    CONSTRAINT "technical_labels_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "domain_labels" (
    "name" TEXT NOT NULL,

    CONSTRAINT "domain_labels_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "user_profile_domain_label" (
    "user_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "user_profile_domain_label_pkey" PRIMARY KEY ("user_id","label_name")
);

-- CreateTable
CREATE TABLE "user_profile_technical_label" (
    "user_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "user_profile_technical_label_pkey" PRIMARY KEY ("user_id","label_name")
);

-- CreateTable
CREATE TABLE "project_domain_label" (
    "project_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "project_domain_label_pkey" PRIMARY KEY ("project_id","label_name")
);

-- CreateTable
CREATE TABLE "project_technical_label" (
    "project_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "project_technical_label_pkey" PRIMARY KEY ("project_id","label_name")
);

-- CreateTable
CREATE TABLE "like" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "like_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "involvement" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "involvement_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "join_request" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "join_request_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_user_id_key" ON "user_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_labels_name_key" ON "technical_labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "domain_labels_name_key" ON "domain_labels"("name");

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_label" ADD CONSTRAINT "user_profile_domain_label_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_label" ADD CONSTRAINT "user_profile_domain_label_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_label" ADD CONSTRAINT "user_profile_technical_label_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_label" ADD CONSTRAINT "user_profile_technical_label_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profile"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_label" ADD CONSTRAINT "project_domain_label_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_label" ADD CONSTRAINT "project_domain_label_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_label" ADD CONSTRAINT "project_technical_label_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_label" ADD CONSTRAINT "project_technical_label_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvement" ADD CONSTRAINT "involvement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvement" ADD CONSTRAINT "involvement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
