import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
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
      throw ServiceException.BadRequestException(
        errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS,
      );
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

    // //InternalServerErrorException
    // if (!createdUser) {
    //   throw new ServiceException(errorMessages.ERROR_CREATING_USER_IN_DB, 500);
    // }

    return this.userMapper.userToUserResponseDTO(createdUser);
  }

  /**
   * get user by ID
   * @param userId - ID for getting user
   * @returns A promise resolving to a UserResponseDto
   */
  async getUser(userId: number): Promise<UserResponseDto> {
    const foundUser = await this.userRepository.getUser(userId);
    //NOT FOUND EXCEPTION
    if (!foundUser)
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND,
      );
    return this.userMapper.userToUserResponseDTO(foundUser);
  }
}
