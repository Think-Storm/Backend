import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ServiceException } from '../exception-filter/serviceException';
import { errorMessages } from '../enums/errorMessages';
import { RedisThrottlerStorageService } from './redisThrottlerStorage.service';
import { generateIp } from './throttlerOptions';

@Injectable()
export class ThrottlerAbusingGuard implements CanActivate {
  constructor(private throttlerGuardService: RedisThrottlerStorageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const realIp = generateIp(context);

    // Check if the IP is blocked
    const blockedIpData = await this.throttlerGuardService.get(realIp);
    if (blockedIpData) {
      // Set the block info (this should happen before throwing the exception)
      await this.throttlerGuardService.set(realIp);

      // Throw the ThrottlerException with the error message
      throw ServiceException.ThrottlerException(errorMessages.THROTTLER_BLOCK);
    }

    // If IP is not blocked, continue to the next step
    return true;
  }
}
