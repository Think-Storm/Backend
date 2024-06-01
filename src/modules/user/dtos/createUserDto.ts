import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class PostDTO {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
