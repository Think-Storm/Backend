import { Prisma } from '@prisma/client';

// Define a Prisma partial type for Language with only code and name
export type LanguageWithCodeAndName = Prisma.LanguageGetPayload<{
  select: {
    code: true;
    name: true;
  };
}>;
