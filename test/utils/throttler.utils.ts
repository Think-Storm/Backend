import { BLOCK_REQUEST_TIME, RATE_LIMITING_TTL } from '../../src/common/consts';

export const mockThrottlerOptions = {
  name: 'API Rate Limiter',
  limit: expect.any(Function),
  ttl: RATE_LIMITING_TTL,
  blockDuration: BLOCK_REQUEST_TIME * 1000,
  ignoreUserAgents: expect.any(Array),
  skipIf: expect.any(Function),
  generateKey: expect.any(Function),
};
