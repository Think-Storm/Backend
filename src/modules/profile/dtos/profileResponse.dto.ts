import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, LanguageName } from '@think-storm/contracts';

export class ProfileResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Profile ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 1, description: 'User ID' })
  userId: number;

  @Expose()
  @ApiProperty({ example: 'Full Name', description: 'Full name of the user' })
  fullName: string;

  @Expose()
  @ApiProperty({
    example: '1990-01-01',
    description: 'Birthdate of the user',
    type: String,
  })
  birthdate: Date;

  @Expose()
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  avatar?: string;

  @Expose()
  @ApiProperty({ example: 'Bio text', description: 'User biography' })
  bio?: string;

  @Expose()
  @ApiProperty({
    example: ['BackendDeveloper'],
    description: 'Preferred roles',
    isArray: true,
    enum: UserRole,
  })
  preferredRole?: string[];

  @Expose()
  @ApiProperty({ example: 'Seoul', description: 'Location' })
  location?: string;

  @Expose()
  @ApiProperty({ example: 'Asia/Seoul', description: 'Timezone' })
  timezone?: string;

  @Expose()
  @ApiProperty({
    example: ['linkedin'],
    description: 'Website types',
    isArray: true,
  })
  websiteType?: string[];

  @Expose()
  @ApiProperty({
    example: ['https://linkedin.com/in/user'],
    description: 'Websites',
    isArray: true,
  })
  website?: string[];

  @Expose()
  @ApiProperty({
    example: ['AI', 'ML'],
    description: 'Domain labels',
    isArray: true,
  })
  domainLabels?: string[];

  @Expose()
  @ApiProperty({
    example: ['English', 'Korean'],
    description: 'Languages',
    isArray: true,
    enum: LanguageName,
  })
  languages?: string[];

  @Expose()
  @ApiProperty({
    example: ['nestjs', 'python'],
    description: 'Technical labels',
    isArray: true,
  })
  technicalLabels?: string[];

  @Expose()
  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Created at',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'Last updated at',
  })
  lastUpdatedAt: Date;
}
