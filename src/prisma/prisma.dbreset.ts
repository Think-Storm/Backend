import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function refreshDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;

  const sequenceNames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT sequence_name FROM information_schema.sequences`;

  const tables = tablenames
    .filter(
      (table) =>
        table['table_name'] !== 'languages' &&
        table['table_name'] !== 'technical_labels' &&
        table['table_name'] !== 'domain_labels' &&
        !table['table_name'].startsWith('_'),
    )
    .map((table) => `"${table['table_name']}"`);

  try {
    for (const tableName of tables) {
      await prisma.$queryRawUnsafe(
        `TRUNCATE TABLE ${tableName.replaceAll('"', '')} CASCADE;`,
      );
    }
    for (const sequenceName of sequenceNames) {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE ${sequenceName['sequence_name']} RESTART WITH 1;`,
      );
    }
  } catch (error) {
    console.log({ error });
  }
}
