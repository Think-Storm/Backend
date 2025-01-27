import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommonDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds all languages
   * @returns A promise resolving to a Language array or null
   */
  async getAllLanguages(): Promise<{ code: string; name: string }[]> {
    const languages = await this.prisma.language.findMany({
      orderBy: { name: 'asc' },
      select: {
        code: true,
        name: true,
      },
    });
    return languages;
  }
}
