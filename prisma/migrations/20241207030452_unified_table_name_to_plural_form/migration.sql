/*
  Warnings:

  - You are about to drop the `involvement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `join_request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_domain_label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_technical_label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profile_domain_label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profile_technical_label` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "involvement" DROP CONSTRAINT "involvement_project_id_fkey";

-- DropForeignKey
ALTER TABLE "involvement" DROP CONSTRAINT "involvement_user_id_fkey";

-- DropForeignKey
ALTER TABLE "join_request" DROP CONSTRAINT "join_request_project_id_fkey";

-- DropForeignKey
ALTER TABLE "join_request" DROP CONSTRAINT "join_request_user_id_fkey";

-- DropForeignKey
ALTER TABLE "project_domain_label" DROP CONSTRAINT "project_domain_label_label_name_fkey";

-- DropForeignKey
ALTER TABLE "project_domain_label" DROP CONSTRAINT "project_domain_label_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_technical_label" DROP CONSTRAINT "project_technical_label_label_name_fkey";

-- DropForeignKey
ALTER TABLE "project_technical_label" DROP CONSTRAINT "project_technical_label_project_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profile" DROP CONSTRAINT "user_profile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_domain_label" DROP CONSTRAINT "user_profile_domain_label_label_name_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_domain_label" DROP CONSTRAINT "user_profile_domain_label_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_technical_label" DROP CONSTRAINT "user_profile_technical_label_label_name_fkey";

-- DropForeignKey
ALTER TABLE "user_profile_technical_label" DROP CONSTRAINT "user_profile_technical_label_user_id_fkey";

-- DropTable
DROP TABLE "involvement";

-- DropTable
DROP TABLE "join_request";

-- DropTable
DROP TABLE "project_domain_label";

-- DropTable
DROP TABLE "project_technical_label";

-- DropTable
DROP TABLE "user_profile";

-- DropTable
DROP TABLE "user_profile_domain_label";

-- DropTable
DROP TABLE "user_profile_technical_label";

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "prefered_role" TEXT,
    "location" TEXT,
    "website" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profile_domain_labels" (
    "user_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "user_profile_domain_labels_pkey" PRIMARY KEY ("user_id","label_name")
);

-- CreateTable
CREATE TABLE "user_profile_technical_labels" (
    "user_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "user_profile_technical_labels_pkey" PRIMARY KEY ("user_id","label_name")
);

-- CreateTable
CREATE TABLE "project_domain_labels" (
    "project_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "project_domain_labels_pkey" PRIMARY KEY ("project_id","label_name")
);

-- CreateTable
CREATE TABLE "project_technical_labels" (
    "project_id" INTEGER NOT NULL,
    "label_name" TEXT NOT NULL,

    CONSTRAINT "project_technical_labels_pkey" PRIMARY KEY ("project_id","label_name")
);

-- CreateTable
CREATE TABLE "involvements" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "involvements_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateTable
CREATE TABLE "join_requests" (
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("user_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_labels" ADD CONSTRAINT "user_profile_domain_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_domain_labels" ADD CONSTRAINT "user_profile_domain_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_labels" ADD CONSTRAINT "user_profile_technical_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_technical_labels" ADD CONSTRAINT "user_profile_technical_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_labels" ADD CONSTRAINT "project_domain_labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_labels" ADD CONSTRAINT "project_domain_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_labels" ADD CONSTRAINT "project_technical_labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_labels" ADD CONSTRAINT "project_technical_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvements" ADD CONSTRAINT "involvements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvements" ADD CONSTRAINT "involvements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
