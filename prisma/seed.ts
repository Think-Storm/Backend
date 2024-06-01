import { LanguageCode, LanguageName, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const languages = [
    { code: LanguageCode.EN, name: LanguageName.English },
    { code: LanguageCode.FR, name: LanguageName.French },
    { code: LanguageCode.KR, name: LanguageName.Korean },
  ];

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

  console.log('Languages have been seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });