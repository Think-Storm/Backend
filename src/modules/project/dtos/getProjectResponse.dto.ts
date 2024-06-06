import { Goal, Language, Status, User } from '@prisma/client';
import { Expose } from 'class-transformer';

export class GetProjectResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  language: Language;

  @Expose()
  labels: string[];

  @Expose()
  description?: string;

  @Expose()
  status: Status;

  @Expose()
  goal: Goal;

  @Expose()
  milestone?: Date;

  @Expose()
  users: User[];

  @Expose()
  createdAt: Date;

  @Expose()
  lastUpdatedAt: Date;
}
