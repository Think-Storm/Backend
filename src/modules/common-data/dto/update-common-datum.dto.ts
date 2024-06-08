import { PartialType } from '@nestjs/swagger';
import { CreateCommonDatumDto } from './create-common-datum.dto';

export class UpdateCommonDatumDto extends PartialType(CreateCommonDatumDto) {}
