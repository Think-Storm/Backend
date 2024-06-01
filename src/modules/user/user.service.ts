import { Injectable } from '@nestjs/common';
import { PostDTO } from './dtos/createUserDto'

@Injectable()
export class UserService {

  doesNameExist(name: string): boolean {
    return Boolean(name)
  }

  doesEmailExist(email: string): boolean {
    return Boolean(email)
  }

  validateUserCreateDto(body: PostDTO): boolean {
    return (this.doesNameExist(body.name) || this.doesEmailExist(body.email))
  }

  getHello(): string {
    return 'Hello World!';
  }

  getGoodbye(id: string): string {
    return `goodbye ${id}!`;
  }
} 
