import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateWaitingListUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
