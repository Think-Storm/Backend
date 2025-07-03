import { PartialType, ApiProperty } from '@nestjs/swagger';
import { UpdateProjectRequestDto } from './updateProjectRequest.dto';
import { IsArray, IsInt } from 'class-validator';
import { Saveproject } from '@think-storm/contracts';

export class SaveProjectRequestDto
  extends PartialType(UpdateProjectRequestDto)
  implements Saveproject
{
  @ApiProperty({ required: true, isArray: true })
  @IsArray()
  @IsInt({ each: true })
  saved_by_users: number[];
}
