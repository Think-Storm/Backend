import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetProjectRequestDto {
  @Type(() => Number)
  @IsInt()
  id: number;
}
