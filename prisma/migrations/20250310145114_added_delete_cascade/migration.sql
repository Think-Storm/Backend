-- DropForeignKey
ALTER TABLE "involvements" DROP CONSTRAINT "involvements_project_id_fkey";

-- DropForeignKey
ALTER TABLE "join_requests" DROP CONSTRAINT "join_requests_project_id_fkey";

-- DropForeignKey
ALTER TABLE "likes" DROP CONSTRAINT "likes_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_domain_labels" DROP CONSTRAINT "project_domain_labels_label_name_fkey";

-- DropForeignKey
ALTER TABLE "project_domain_labels" DROP CONSTRAINT "project_domain_labels_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_technical_labels" DROP CONSTRAINT "project_technical_labels_label_name_fkey";

-- DropForeignKey
ALTER TABLE "project_technical_labels" DROP CONSTRAINT "project_technical_labels_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_founder_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_language_code_fkey";

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_labels" ADD CONSTRAINT "project_domain_labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_domain_labels" ADD CONSTRAINT "project_domain_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "domain_labels"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_labels" ADD CONSTRAINT "project_technical_labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_technical_labels" ADD CONSTRAINT "project_technical_labels_label_name_fkey" FOREIGN KEY ("label_name") REFERENCES "technical_labels"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "involvements" ADD CONSTRAINT "involvements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
