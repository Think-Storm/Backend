import { Module } from '@nestjs/common';
import { CommonDataService } from './common-data.service';
import { CommonDataController } from './common-data.controller';

@Module({
  controllers: [CommonDataController],
  providers: [CommonDataService],
})
export class CommonDataModule {}
