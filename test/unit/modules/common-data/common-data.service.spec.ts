import { Test, TestingModule } from '@nestjs/testing';
import { CommonDataService } from '../../../../src/modules/common-data/common-data.service';

describe('CommonDataService', () => {
  let service: CommonDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonDataService],
    }).compile();

    service = module.get<CommonDataService>(CommonDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
