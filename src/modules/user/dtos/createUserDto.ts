import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class PostDTO {
    @IsOptional()
    name: string;

    @IsOptional()
    email: string;

    password :string;
}

