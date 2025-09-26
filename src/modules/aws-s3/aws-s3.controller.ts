import { Controller, Get, Query } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';

@Controller()
export class AwsS3Controller {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @Get('presigned')
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('mimetype') mimetype: string,
    @Query('folder') folder: string,
  ) {
    return await this.awsS3Service.generatePresignedUrl(
      folder,
      filename,
      mimetype,
    );
  }
}
