import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '@think-storm/contracts';

export class UserResponseDto implements UserResponse {
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
  @Expose()
  password: string;

  @ApiProperty({ writeOnly: true })
  @Expose()
  passwordChangedAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  fullName?: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @Expose()
  birthdate?: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @Expose()
  lastUpdatedAt: Date;
}
