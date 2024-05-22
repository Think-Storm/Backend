import { Injectable } from '@nestjs/common';
import { PostDTO } from './dtos/createUserDto'

@Injectable()
export class UserService {

  validateUserCreateDto(body: PostDTO): boolean {
    return(!!body.name && !!body.email)
  }


  getHello(): string {
    return 'Hello World!';
  }


  getGoodbye(id: string): string {
    return `goodbye ${id}!`;
  }
} 
