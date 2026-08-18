import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

const ALLOWED_IMAGE_MIMETYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

export class PresignedUrlQueryDto {
  @ApiProperty({ description: 'Name of the file to upload' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'filename may only contain letters, numbers, dots, underscores and hyphens',
  })
  filename: string;

  @ApiProperty({
    description: 'MIME type of the file',
    enum: ALLOWED_IMAGE_MIMETYPES,
  })
  @IsString()
  @IsIn(ALLOWED_IMAGE_MIMETYPES, {
    message: `mimetype must be one of: ${ALLOWED_IMAGE_MIMETYPES.join(', ')}`,
  })
  mimetype: string;

  @ApiProperty({ description: 'Folder to upload the file into' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message:
      'folder may only contain letters, numbers, slashes, underscores and hyphens',
  })
  folder: string;
}
