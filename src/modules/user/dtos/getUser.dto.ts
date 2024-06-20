import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class getUserDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}
