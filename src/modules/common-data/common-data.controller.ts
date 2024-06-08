import { Controller, Get, HttpCode } from '@nestjs/common';
import { CommonDataService } from './common-data.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('common-data')
@Controller()
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
  findAll() {
    return this.commonDataService.findAllLanguages();
  }
}
