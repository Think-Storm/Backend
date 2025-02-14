import { ExecutionContext } from '@nestjs/common';
import {
  BLOCK_REQUEST_TIME,
  RATE_LIMITING_LIMIT,
  RATE_LIMITING_TTL,
} from '../consts';
import { ThrottlerOptions } from '@nestjs/throttler';
import RequestWithUserRole from '../../../src/modules/auth/local/requestWithUserRole.interface';

// A custom function to resolve the `limit` based on some condition
export const resolveLimit = (context: Partial<ExecutionContext>): number => {
  // For example, apply different limits based on the user role
  const req = context.switchToHttp().getRequest<RequestWithUserRole>();
  if (req.user && req.user.role === 'admin') {
    return RATE_LIMITING_LIMIT * 10; // Admin can make 10 times more requests per TTL period
  }
  return RATE_LIMITING_LIMIT; // Regular users can make only RATE_LIMITING_LIMIT requests
};

// A custom function to generate a key for each user based on their IP address
export const generateIp = (context: Partial<ExecutionContext>): string => {
  const request = context.switchToHttp().getRequest();
  // Use IP address as the key
  return (
    request.headers['x-forwarded-for']?.split(',')[0] ||
    request.connection.remoteAddress
  );
};

// A custom function to check whether the request should be skipped based on certain criteria
export const shouldSkip = (context: Partial<ExecutionContext>): boolean => {
  const req = context.switchToHttp().getRequest<Request>();
  // For example, if the request is coming from a certain user-agent, skip throttling
  return req.headers['user-agent']?.includes('bot');
};

// Define the ThrottlerOptions
export const throttlerOptions: ThrottlerOptions = {
  name: 'API Rate Limiter', // Optional, for identification purposes
  limit: resolveLimit, // Resolves limit based on context (ex. user role)
  ttl: RATE_LIMITING_TTL, // 1s TTL (Time-to-Live) for rate-limiting
  blockDuration: BLOCK_REQUEST_TIME * 1000, // 1 hour block duration if the limit is exceeded
  ignoreUserAgents: [/bot/i], // Ignore requests from user agents matching this pattern
  skipIf: shouldSkip, // Skip throttling for specific conditions
  //getTracker: (context: ExecutionContext) => {
  // Custom tracker for counting requests from the user (could use a database, in-memory store, etc)
  //},
  generateKey: generateIp, // Generate a key based on IP address
};
