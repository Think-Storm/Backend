import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  fullName?: string;

  @Expose()
  birthdate?: Date;

  @Expose()
  avatar?: string;

  @Expose()
  bio?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  lastUpdatedAt: Date;
}
