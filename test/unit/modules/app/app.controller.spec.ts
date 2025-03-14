import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../../../src/app.controller';
import 'reflect-metadata';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return healthy status', () => {
      const result = appController.healthCheck();
      expect(result).toEqual({ status: 'ok' });
    });
  });
});
