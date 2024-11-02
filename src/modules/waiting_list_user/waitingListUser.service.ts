import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateWaitingListUserDto } from './dtos/createWaitingListUser.dto';
import { WaitingListUserRepository } from './waitingListUser.repository';
import { WaitingListUserResponseDto } from './dtos/waitingListUserResponse.dto';
import { errorMessages } from '../../common/enums/errorMessages';
import { WaitingListUser } from '@prisma/client';
import { WaitingListUserMapper } from './dtos/waitingListUser.mapper';

@Injectable()
export class WaitingListUserService {
  constructor(
    private waitingListUserRepository: WaitingListUserRepository,
    private waitingListUserMapper: WaitingListUserMapper,
  ) {}

  /**
   * Checks if a waitingListUser with the given email exists
   * @param email - The email to check
   * @returns A promise resolving to a WaitingListUser object or null
   */
  async doesWaitingListUserWithEmailExist(
    email: string,
  ): Promise<WaitingListUser> {
    return this.waitingListUserRepository.getWaitingListUserByEmail(email);
  }

  /**
   * Validates the CreateWaitingListUserDto
   * @param dto - The data transfer object to validate
   * @throws BadRequestException if the email is already in use
   */
  async isWaitingListUserCreateDtoValid(dto: CreateWaitingListUserDto) {
    if (await this.doesWaitingListUserWithEmailExist(dto.email)) {
      throw ServiceException.BadRequestException(
        errorMessages.WAITING_LIST_USER_WITH_EMAIL_ALREADY_EXISTS,
      );
    }
  }

  /**
   * Creates a new waitingListUser
   * @param createWaitingListUserDto - The data transfer object for creating a waitingListUser
   * @returns A promise resolving to a WaitingListUserResponseDto
   */
  async createWaitingListUser(
    createWaitingListUserDto: CreateWaitingListUserDto,
  ): Promise<WaitingListUserResponseDto> {
    const createdWaitingListUser =
      await this.waitingListUserRepository.createWaitingListUser(
        createWaitingListUserDto,
      );

    return this.waitingListUserMapper.waitingListUserToWaitingListUserResponseDTO(
      createdWaitingListUser,
    );
  }
}
