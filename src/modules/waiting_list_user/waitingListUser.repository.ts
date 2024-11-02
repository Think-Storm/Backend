import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WaitingListUser } from '@prisma/client';
import { CreateWaitingListUserDto } from './dtos/createWaitingListUser.dto';
import { ServiceException } from '../../common/exception-filter/serviceException';

@Injectable()
export class WaitingListUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a waiting list user by email
   * @param email - The email of the waiting list user to find
   * @returns A promise resolving to a WaitingListUser object or null
   */
  async getWaitingListUserByEmail(email: string) {
    return this.prisma.waitingListUser.findFirst({
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
    });
  }

  /**
   * Creates a new waiting list user
   * @param createWaitingListUserDto - The data transfer object containing waiting list user creation details
   * @returns A promise resolving to the created WaitingListUser object
   */
  async createWaitingListUser(
    createWaitingListUserDto: CreateWaitingListUserDto,
  ): Promise<WaitingListUser> {
    try {
      return this.prisma.waitingListUser.create({
        data: {
          email: createWaitingListUserDto.email.toLowerCase(),
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(error.message, error);
    }
  }
}
