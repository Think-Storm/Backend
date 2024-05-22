import { PostDTO } from './dtos/createUserDto';
export declare class UserService {
    validateUserCreateDto(body: PostDTO): boolean;
    getHello(): string;
    getGoodbye(id: string): string;
}
