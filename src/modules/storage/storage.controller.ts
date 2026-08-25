import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';

@ApiTags('storage')
@ApiBearerAuth()
// Previously unguarded: any caller could mint upload URLs into the bucket.
@UseGuards(JwtAuthGuard)
@Controller()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('presigned')
  @ApiOperation({ summary: 'Create a short-lived direct-upload URL' })
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('folder') folder: string,
  ) {
    return await this.storageService.generatePresignedUrl(folder, filename);
  }
}
