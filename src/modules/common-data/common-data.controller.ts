import { Controller, Get, HttpCode } from '@nestjs/common';
import { CommonDataService } from './common-data.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('common-data')
@Controller()
@CacheKey('languages')
@CacheTTL(3600)
export class CommonDataController {
  constructor(private readonly commonDataService: CommonDataService) {}

  @HttpCode(200)
  @Get('languages')
  @ApiOperation({ summary: 'Get all languages' })
  @ApiResponse({
    status: 200,
    description: 'Get all languages success',
  })
  @ApiResponse({ status: 404, description: 'Languages not found' })
  async getAllLanguages() {
    return this.commonDataService.getAllLanguages();
  }
}
