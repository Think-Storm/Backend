import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class loginUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
