import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(userId: number): Promise<User> {
    return this.userRepository.getUser(userId);
  }
}
