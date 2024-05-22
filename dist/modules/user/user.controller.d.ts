import { UserService } from './user.service';
import { PostDTO } from './dtos/createUserDto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getHello(): string;
    getGoodBye(id: string): string;
    postGoodBye(body: PostDTO): string;
}
