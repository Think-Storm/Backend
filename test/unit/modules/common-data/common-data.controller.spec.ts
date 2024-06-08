import { Test, TestingModule } from '@nestjs/testing';
import { CommonDataController } from './common-data.controller';
import { CommonDataService } from './common-data.service';

describe('CommonDataController', () => {
  let controller: CommonDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonDataController],
      providers: [CommonDataService],
    }).compile();

    controller = module.get<CommonDataController>(CommonDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
