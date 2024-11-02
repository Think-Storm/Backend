import { WaitingListUserService } from './waitingListUser.service';
import { CreateWaitingListUserDto } from './dtos/createWaitingListUser.dto';
import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { WaitingListUserResponseDto } from './dtos/waitingListUserResponse.dto';

@Controller()
export class WaitingListUserController {
  constructor(
    private readonly waitingListUserService: WaitingListUserService,
  ) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(201)
  @Post()
  async createWaitingListUser(
    @Body() body: CreateWaitingListUserDto,
  ): Promise<WaitingListUserResponseDto> {
    await this.waitingListUserService.isWaitingListUserCreateDtoValid(body);
    return this.waitingListUserService.createWaitingListUser(body);
  }
}
