import { UserProfile } from '@prisma/client';
import { LanguageCode } from '@think-storm/contracts';
import { CreateUserProfileDto } from '../../src/modules/profile/dtos/createUserProfile.dto';

export const defaultCreateProfileDto: CreateUserProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  preferred_role: 'Backend Developer',
  location: 'Test Location',
  website: 'https://example.com',
  domain_labels: ['Web Development'],
  languages: [LanguageCode.EN],
  technical_labels: ['NestJS'],
};

export const defaultProfileResponse = {
  message: 'Create User Profile Success',
  data: {
    id: 1,
    userId: 1,
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    preferedRole: 'Backend Developer',
    location: 'Test Location',
    website: 'https://example.com',
  },
};

export const defaultMockUserProfile: UserProfile = {
  id: 1,
  userId: 1,
  avatar: defaultCreateProfileDto.avatar,
  bio: defaultCreateProfileDto.bio,
  preferedRole: defaultCreateProfileDto.preferred_role,
  location: defaultCreateProfileDto.location,
  website: defaultCreateProfileDto.website,
};

export const defaultMockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedPassword',
  passwordSalt: 'salt',
  passwordChangedAt: new Date(),
  fullName: 'Test User',
  birthdate: new Date(),
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const defaultProfileWithAssociations = {
  ...defaultMockUserProfile,
  interests: [{ label: { name: 'Web Development' } }],
  languages: [{ language: { code: LanguageCode.EN } }],
  skills: [{ label: { name: 'NestJS' } }],
};

export const defaultE2ECreateProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  preferred_role: 'Backend Developer',
  location: 'Test Location',
  website: 'https://example.com',
  domain_labels: ['Web Development', 'Cloud Computing'],
  languages: ['EN', 'KR'],
  technical_labels: ['NestJS', 'TypeScript', 'PostgreSQL'],
};
