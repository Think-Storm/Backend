import { ExecutionContext } from '@nestjs/common';
import {
  throttlerOptions,
  resolveLimit,
  generateIp,
  shouldSkip,
} from '../../../../src/common/throttler/throttlerOptions';
import {
  BLOCK_REQUEST_TIME,
  RATE_LIMITING_LIMIT,
  RATE_LIMITING_TTL,
} from '../../../../src/common/consts';

describe('throttlerOptions', () => {
  describe('resolveLimit', () => {
    it('should return increased limit for admin users', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'admin' } }),
        }),
      } as Partial<ExecutionContext>;

      const limit = resolveLimit(context);
      expect(limit).toBe(RATE_LIMITING_LIMIT * 10);
    });

    it('should return default limit for regular users', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'user' } }),
        }),
      } as Partial<ExecutionContext>;

      const limit = resolveLimit(context);
      expect(limit).toBe(RATE_LIMITING_LIMIT);
    });

    it('should return default limit if user is not defined', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as Partial<ExecutionContext>;

      const limit = resolveLimit(context);
      expect(limit).toBe(RATE_LIMITING_LIMIT);
    });
  });

  describe('generateIp', () => {
    it('should return IP from x-forwarded-for header', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '192.168.1.1, 192.168.1.2' },
            connection: { remoteAddress: '127.0.0.1' },
          }),
        }),
      } as Partial<ExecutionContext>;

      const ip = generateIp(context);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return IP from connection.remoteAddress if x-forwarded-for is not present', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            connection: { remoteAddress: '127.0.0.1' },
          }),
        }),
      } as Partial<ExecutionContext>;

      const ip = generateIp(context);
      expect(ip).toBe('127.0.0.1');
    });
  });

  describe('shouldSkip', () => {
    it('should return true if user-agent contains bot', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'user-agent': 'Googlebot' },
          }),
        }),
      } as Partial<ExecutionContext>;

      const skip = shouldSkip(context);
      expect(skip).toBe(true);
    });

    it('should return false if user-agent does not contain bot', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'user-agent': 'Mozilla/5.0' },
          }),
        }),
      } as Partial<ExecutionContext>;

      const skip = shouldSkip(context);
      expect(skip).toBe(false);
    });
  });

  describe('throttlerOptions', () => {
    it('should have correct properties', () => {
      expect(throttlerOptions).toMatchObject({
        name: 'API Rate Limiter',
        limit: expect.any(Function) || RATE_LIMITING_LIMIT,
        ttl: RATE_LIMITING_TTL,
        blockDuration: BLOCK_REQUEST_TIME * 1000,
        ignoreUserAgents: [/bot/i],
        skipIf: expect.any(Function),
        generateKey: expect.any(Function),
      });
    });

    it('should resolve limit correctly', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: 'admin' } }),
        }),
      } as ExecutionContext;

      const limit =
        typeof throttlerOptions.limit === 'function'
          ? throttlerOptions.limit(context)
          : throttlerOptions.limit;
      expect(limit).toBe(RATE_LIMITING_LIMIT * 10);
    });

    it('should generate key correctly', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-forwarded-for': '192.168.1.1' },
            connection: { remoteAddress: '127.0.0.1' },
          }),
        }),
      } as ExecutionContext;

      const key = throttlerOptions.generateKey(
        context,
        'API Rate Tracker',
        'API Rate Limiter',
      );
      expect(key).toBe('192.168.1.1');
    });

    it('should skip correctly based on user-agent', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'user-agent': 'Googlebot' },
          }),
        }),
      } as ExecutionContext;

      const skip = throttlerOptions.skipIf(context);
      expect(skip).toBe(true);
    });
  });
});
