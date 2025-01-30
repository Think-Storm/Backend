import { Test, TestingModule } from '@nestjs/testing';
import { PrismaExceptionFilter } from '../../../../src/common/exception-filter/prisma-exception.filter';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaExceptionFilter],
    }).compile();

    filter = module.get<PrismaExceptionFilter>(PrismaExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    let mockGetResponse: jest.Mock;
    let mockGetRequest: jest.Mock;
    let mockHttpArgumentsHost: jest.Mock;
    let mockArgumentsHost: ArgumentsHost;

    beforeEach(() => {
      mockJson = jest.fn();
      mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
      mockGetRequest = jest.fn();
      mockHttpArgumentsHost = jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      });

      mockArgumentsHost = {
        switchToHttp: mockHttpArgumentsHost,
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        getType: jest.fn(),
      };
    });

    it('should handle P2025 (Record not found) error', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '1.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
      });
    });

    it('should handle P2002 (Unique constraint violation) error', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '1.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: 'Unique constraint violation',
      });
    });

    it('should handle unknown Prisma error', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '1.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    });
  });
});
