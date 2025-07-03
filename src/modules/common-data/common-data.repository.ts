import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LanguageWithCodeAndName } from './types/commonData.types';

@Injectable()
export class CommonDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds all languages
   * @returns A promise resolving to an array of languages with code and name
   */
  async getAllLanguages(): Promise<LanguageWithCodeAndName[]> {
    try {
      return await this.prisma.language.findMany({
        select: {
          code: true,
          name: true,
        },
      });
    } catch (error) {
      // Log the error or handle it appropriately
      console.error('Error fetching languages:', error);
      throw error; // Re-throw to let the service/controller handle it
    }
  }
}
