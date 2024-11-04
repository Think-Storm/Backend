import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { errorMessages } from '../../../src/common/enums/errorMessages';
import { ServiceException } from './../../common/exception-filter/serviceException';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from '../auth/dtos/userResponse.dto';
import { DAY_TO_MILISECONDS_RATIO } from '../../common/consts';
import { CreateUserDto } from '../auth/dtos/createUser.dto';
import { UserMapper } from './../auth/dtos/user.mapper';
import { UserService } from './../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private userMapper: UserMapper,
    private passwordEncryption: PasswordEncryption,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validates the CreateUserDto
   * @param dto - The data transfer object to validate
   * @throws BadRequestException if the email is already in use
   */
  isUserCreateDtoValid = async (dto: CreateUserDto) => {
    if (await this.userService.doesUserWithEmailExist(dto.email)) {
      throw ServiceException.BadRequestException(
        errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS,
      );
    }
  };

  /**
   * Creates a new user
   * @param createUserDto - The data transfer object for creating a user
   * @returns A promise resolving to a UserResponseDto
   */
  register = async (createUserDto: CreateUserDto): Promise<UserResponseDto> => {
    // 1) check if there user email exists
    await this.isUserCreateDtoValid(createUserDto);

    // 2) create salt password and save encrypted password, user Info
    const passwordInformation =
      await this.passwordEncryption.createSaltAndHashedPassword(
        createUserDto.password,
      );
    createUserDto.password = passwordInformation.hashedPassword;
    const createdUser = await this.userService.createUser(
      createUserDto,
      passwordInformation.passwordSalt,
    );

    return this.userMapper.userToUserResponseDTO(createdUser);
  };

  /**
   * Check if user and password is right
   * @param email - user email to check
   * @param password - user password to check
   * @returns A promise resolving to a User object or null
   */
  checkUserAndPassword = async (email: string, password: string) => {
    const user = await this.userService.doesUserWithEmailExist(email);

    if (
      !user ||
      !(await this.passwordEncryption.isPasswordCorrect(
        password,
        user.password,
      ))
    ) {
      throw ServiceException.UnAuthorizedException(
        errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
      );
    }

    return user;
  };

  /**
   * generates token
   * @param id - user id as jwt token id
   * @returns jwt token created by user id
   */
  signToken = (id: number) => {
    return this.jwtService.sign({ id });
  };

  /**
   * verify token
   * @param token - created token string by signToken
   * @param secret - secret string for checking validation of token
   * @returns true or false
   */
  verifyToken = async (token: string, secret: string) => {
    return await this.jwtService.verify(token, { secret });
  };

  /**
   * get generated token string
   * @param user - returned user object
   * @returns generated token string
   */
  getToken = (user: UserResponseDto): string => {
    const token = this.signToken(user.id);

    return token;
  };

  /**
   * authenticate user with jwt token
   * @param user - returned user object
   * @param res - response object with jwt token
   * @returns user response data transfer object or null
   */
  authentication(user: UserResponseDto, @Res() res: Response): UserResponseDto {
    const token = this.getToken(user);
    res.setHeader('Authorization', 'Bearer ' + token);

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      expires: new Date(
        Date.now() +
          Number(process.env.JWT_COOKIE_EXPIRES_IN) * DAY_TO_MILISECONDS_RATIO,
      ),
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    return user;
  }
}