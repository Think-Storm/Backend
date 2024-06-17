import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { errorMessages } from '../../common/errorMessages';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async getUser(userId: number): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!foundUser)
      throw new NotFoundException(errorMessages.GET_USER_ERROR_MESSAGE);
    return foundUser;
  }
}
