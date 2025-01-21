import { Module } from '@nestjs/common';
import { CommonDataService } from './common-data.service';
import { CommonDataController } from './common-data.controller';
import { CommonDataRepository } from './common-data.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonDataMapper } from './dto/common-data.mapper';

@Module({
  imports: [PrismaModule],
  controllers: [CommonDataController],
  providers: [CommonDataService, CommonDataMapper, CommonDataRepository],
  exports: [CommonDataService, CommonDataRepository],
})
export class CommonDataModule {}
