import { Injectable } from '@nestjs/common';
import { AppError } from './../../common/appError';
import { CreateUserDto } from './dtos/createUser.dto';
import { UserRepository } from './user.repository';
import { UserResponseDto } from './dtos/userResponse.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { User } from '@prisma/client';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from './dtos/user.mapper';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
  ) {}

  /**
   * Checks if a user with the given email exists
   * @param email - The email to check
   * @returns A promise resolving to a User object or null
   */
  async doesUserWithEmailExist(email: string): Promise<User> {
    return this.userRepository.getUserByEmail(email);
  }

  /**
   * Validates the CreateUserDto
   * @param dto - The data transfer object to validate
   * @throws BadRequestException if the email is already in use
   */
  async IsUserCreateDtoValid(dto: CreateUserDto) {
    if (await this.doesUserWithEmailExist(dto.email)) {
      //BAD REQUEST EXCEPTION
      throw new AppError(errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS, 400);
    }
  }

  /**
   * Creates a new user
   * @param createUserDto - The data transfer object for creating a user
   * @returns A promise resolving to a UserResponseDto
   */
  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const passwordInformation =
      await this.passwordEncryption.createSaltAndHashedPassword(
        createUserDto.password,
      );
    createUserDto.password = passwordInformation.hashedPassword;
    const createdUser = await this.userRepository.createUser(
      createUserDto,
      passwordInformation.passwordSalt,
    );

    return this.userMapper.userToUserResponseDTO(createdUser);
  }

  async getUser(userId: number): Promise<UserResponseDto> {
    console.log(typeof userId);
    const foundUser = await this.userRepository.getUser(userId);
    //NOT FOUND EXCEPTION
    if (!foundUser)
      throw new AppError(errorMessages.GET_USER_ERROR_MESSAGE, 404);
    return this.userMapper.userToUserResponseDTO(foundUser);
  }
}
