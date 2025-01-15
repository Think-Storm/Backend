import { PrismaClient } from '@prisma/client';
import { languages } from './seed-data/language';
import { technicalLabel } from './seed-data/technicalLabel';
import { domainLabel } from './seed-data/domainLabel';
import { roles } from './seed-data/role';
const prisma = new PrismaClient();

async function main() {
  languages.forEach(async (language) => {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {},
      create: {
        code: language.code,
        name: language.name,
      },
    });
  });
  technicalLabel.forEach(async (label) => {
    await prisma.technicalLabel.upsert({
      where: { name: label.name },
      update: {},
      create: {
        name: label.name,
      },
    });
  });
  domainLabel.forEach(async (label) => {
    await prisma.domainLabel.upsert({
      where: { name: label.name },
      update: {},
      create: {
        name: label.name,
      },
    });
  });
  roles.forEach(async (role) => {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
