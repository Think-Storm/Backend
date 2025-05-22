/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerAbusingGuard } from '../../../../src/common/throttler/throttlerAbusingGuard';
import { RedisThrottlerStorageService } from '../../../../src/common/throttler/redisThrottlerStorage.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { throttlerOptions } from '../../../../src/common/throttler/throttlerOptions';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtHelperService } from '../../../../src/modules/auth/jwt/jwt-helper.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import { PrismaService } from '../../../../src/prisma/prisma.service';

describe('ThrottlerAbusingGuard', () => {
  let guard: ThrottlerAbusingGuard;
  let throttlerStorageService: RedisThrottlerStorageService;

  // Mock execution context
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        headers: { 'x-forwarded-for': '127.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
        user: { id: 1, email: 'test@example.com' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: 'test-secret',
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        ThrottlerAbusingGuard,
        {
          provide: RedisThrottlerStorageService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: JwtHelperService,
          useValue: {
            validate: jest
              .fn()
              .mockResolvedValue({ id: 1, email: 'test@example.com' }),
            checkUserExistsInDB: jest
              .fn()
              .mockResolvedValue({ id: 1, email: 'test@example.com' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        JwtHelperService,
        UserRepository,
        PasswordEncryption,
        PrismaService,
      ],
    })
      .overrideGuard(ThrottlerAbusingGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    guard = module.get<ThrottlerAbusingGuard>(ThrottlerAbusingGuard);
    throttlerStorageService = module.get<RedisThrottlerStorageService>(
      RedisThrottlerStorageService,
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(throttlerStorageService).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if IP is not blocked', async () => {
      // Mock the get method to return null (IP not blocked)
      jest.spyOn(throttlerStorageService, 'get').mockResolvedValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(throttlerStorageService.get).toHaveBeenCalledWith('127.0.0.1');
      expect(result).toBe(true);
      expect(throttlerStorageService.set).not.toHaveBeenCalled();
    });

    it('should throw ThrottlerException if IP is blocked', async () => {
      // Mock the get method to return throttler options (IP is blocked)
      jest
        .spyOn(throttlerStorageService, 'get')
        .mockResolvedValue(throttlerOptions);

      // Expect the canActivate method to throw a ThrottlerException
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ServiceException.ThrottlerException(errorMessages.THROTTLER_BLOCK),
      );

      expect(throttlerStorageService.get).toHaveBeenCalledWith('127.0.0.1');
      expect(throttlerStorageService.set).toHaveBeenCalledWith('127.0.0.1');
    });

    it('should handle IP from x-forwarded-for header', async () => {
      // Mock the get method to return null (IP not blocked)
      jest.spyOn(throttlerStorageService, 'get').mockResolvedValue(null);

      // Create a context with x-forwarded-for header
      const contextWithForwardedHeader = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { 'x-forwarded-for': '192.168.1.1' },
            connection: { remoteAddress: '127.0.0.1' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(contextWithForwardedHeader);

      expect(throttlerStorageService.get).toHaveBeenCalledWith('192.168.1.1');
      expect(result).toBe(true);
    });

    it('should handle IP from connection.remoteAddress if x-forwarded-for is not present', async () => {
      // Mock the get method to return null (IP not blocked)
      jest.spyOn(throttlerStorageService, 'get').mockResolvedValue(null);

      // Create a context without x-forwarded-for header
      const contextWithoutForwardedHeader = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            connection: { remoteAddress: '192.168.1.2' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(contextWithoutForwardedHeader);

      expect(throttlerStorageService.get).toHaveBeenCalledWith('192.168.1.2');
      expect(result).toBe(true);
    });

    it('should handle comma-separated IPs in x-forwarded-for header', async () => {
      // Mock the get method to return null (IP not blocked)
      jest.spyOn(throttlerStorageService, 'get').mockResolvedValue(null);

      // Create a context with multiple IPs in x-forwarded-for header
      const contextWithMultipleIPs = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { 'x-forwarded-for': '192.168.1.3,10.0.0.1,172.16.0.1' },
            connection: { remoteAddress: '127.0.0.1' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(contextWithMultipleIPs);

      // Should use the first IP in the list
      expect(throttlerStorageService.get).toHaveBeenCalledWith('192.168.1.3');
      expect(result).toBe(true);
    });

    it('should handle authentication with JWT token', async () => {
      jest.spyOn(throttlerStorageService, 'get').mockResolvedValue(null);

      const contextWithAuth = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-forwarded-for': '127.0.0.1',
              authorization: 'Bearer test-token',
            },
            connection: { remoteAddress: '127.0.0.1' },
            user: { id: 1, email: 'test@example.com' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(contextWithAuth);

      expect(result).toBe(true);
      expect(throttlerStorageService.get).toHaveBeenCalledWith('127.0.0.1');
    });
  });
});
