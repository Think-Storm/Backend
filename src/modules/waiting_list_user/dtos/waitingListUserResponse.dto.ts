import { Expose } from 'class-transformer';

export class WaitingListUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  createdAt: Date;

  @Expose()
  lastUpdatedAt: Date;
}
