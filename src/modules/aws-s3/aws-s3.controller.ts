import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AwsS3Service } from './aws-s3.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { PresignedUrlQueryDto } from './dtos/presignedUrlQuery.dto';
import { User } from '@think-storm/contracts';

@ApiTags('aws-s3')
@Controller()
export class AwsS3Controller {
  constructor(private readonly awsS3Service: AwsS3Service) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned S3 upload URL' })
  @Get('presigned')
  async getPresignedUrl(
    @Query() query: PresignedUrlQueryDto,
    @GetUser() user: User,
  ) {
    return await this.awsS3Service.generatePresignedUrl(
      query.folder,
      query.filename,
      query.mimetype,
      user.id,
    );
  }
}
