import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Language } from '@prisma/client';

@Injectable()
export class CommonDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds all languages
   * @returns A promise resolving to a Language array or null
   */
  async getAllLanguages(): Promise<Language[]> {
    return this.prisma.language.findMany();
  }
}
