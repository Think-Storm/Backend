import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserProfileResponseDto implements Partial<UserProfile> {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  userId: number;

  @Expose()
  @ApiProperty()
  bio?: string;

  @Expose()
  @ApiProperty()
  avatar?: string;

  @Expose()
  @ApiProperty()
  preferedRole?: string;

  @Expose()
  @ApiProperty()
  location?: string;

  @Expose()
  @ApiProperty()
  website?: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
