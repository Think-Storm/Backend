import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty({ writeOnly: true })
  @Exclude()
  password: string;

  @ApiProperty({ required: false })
  @Expose()
  fullName?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @Expose()
  birthdate?: Date;

  @ApiProperty({ required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ required: false })
  @Expose()
  bio?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  lastUpdatedAt: Date;
}
