import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function refreshDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;

  const tables = tablenames
    .filter(
      (table) =>
        table['table_name'] !== '_prisma_migrations' &&
        table['table_name'] !== 'languages' &&
        !table['table_name'].startsWith('_'),
    )
    .map((table) => `"${table['table_name']}"`);

  try {
    for (const tableName of tables) {
      await prisma.$queryRawUnsafe(
        `TRUNCATE TABLE ${tableName.replaceAll('"', '')} CASCADE;`,
      );
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE ${tableName.replaceAll('"', '')}_id_seq RESTART WITH 1;`,
      );
    }
  } catch (error) {
    console.log({ error });
  }
}
