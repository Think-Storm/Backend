-- AlterTable
ALTER TABLE "_ProjectToUser" ADD CONSTRAINT "_ProjectToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProjectToUser_AB_unique";
