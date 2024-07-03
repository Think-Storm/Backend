import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Exclude()
  password: string;

  @Expose()
  fullName?: string;

  @Expose()
  birthdate?: Date;

  @Expose()
  avatar?: string;

  @Expose()
  bio?: string;

  @Expose()
  token: string;

  @Expose()
  createdAt: Date;

  @Expose()
  lastUpdatedAt: Date;
}
