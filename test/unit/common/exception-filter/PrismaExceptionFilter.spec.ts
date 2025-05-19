import { PrismaExceptionFilter } from '../../../../src/common/exception-filter/prisma-exception.filter';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: any;
  let mockCtx: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockCtx = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };
    mockHost = {
      switchToHttp: () => mockCtx,
    } as unknown as ArgumentsHost;
  });

  it('should handle P2025 (Record not found)', () => {
    const exception = { code: 'P2025' } as any;
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Record not found',
    });
  });

  it('should handle P2002 (Unique constraint violation)', () => {
    const exception = { code: 'P2002' } as any;
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Unique constraint violation',
    });
  });

  it('should handle unknown errors', () => {
    const exception = { code: 'UNKNOWN' } as any;
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
