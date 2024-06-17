import { Injectable } from '@nestjs/common';
import { PostDTO } from './dtos/createUserDto';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  doesNameExist(name: string): boolean {
    return name !== null;
  }

  doesEmailExist(email: string): boolean {
    return email !== null;
  }

  validateUserCreateDto(body: PostDTO): boolean {
    return this.doesNameExist(body.name) || this.doesEmailExist(body.email);
  }

  getHello(): string {
    return 'Hello World!';
  }

  getGoodbye(id: string): string {
    return `goodbye ${id}!`;
  }

  getUser(userId: number): User {
    const foundUser = this.users.find((u) => u.id === userId);
    if (!foundUser) throw new NotFoundException();
    return foundUser;
  }
}
