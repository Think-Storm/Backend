import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/createUser.dto';
import { UserRepository } from './user.repository';
import { CreateUserResponseDto } from './dtos/createUserResponse.dto';
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
  async isUserCreateDtoValid(dto: CreateUserDto) {
    if (await this.doesUserWithEmailExist(dto.email)) {
      throw new BadRequestException(
        errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS,
      );
    }
  }

  /**
   * Creates a new user
   * @param createUserDto - The data transfer object for creating a user
   * @returns A promise resolving to a CreateUserResponseDto
   */
  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    const passwordInformation =
      await this.passwordEncryption.createSaltAndHashedPassword(
        createUserDto.password,
      );
    createUserDto.password = passwordInformation.hashedPassword;
    const createdUser = await this.userRepository.createUser(
      createUserDto,
      passwordInformation.passwordSalt,
    );

    return this.userMapper.userToCreateUserResponseDTO(createdUser);
  }
}
