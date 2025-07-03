import { UserProfile } from '@prisma/client';
import { LanguageCode, UserRole } from '@think-storm/contracts';
import { CreateUserProfileDto } from '../../src/modules/profile/dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from '../../src/modules/profile/dtos/updateUserProfile.dto';

export const defaultCreateProfileDto: CreateUserProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferred_role: [UserRole.BackendDeveloper],
  location: 'Test Location',
  website: 'https://example.com',
  domain_labels: ['Web Development'],
  languages: [LanguageCode.EN],
  technical_labels: ['nestjs'],
};

export const defaultProfileResponse = {
  message: 'Create User Profile Success',
  data: {
    id: 1,
    userId: 1,
    fullName: 'Full Name',
    birthdate: new Date('2000-01-01'),
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    preferredRole: [UserRole.BackendDeveloper],
    location: 'Test Location',
    website: 'https://example.com',
  },
};

export const defaultMockUserProfile: UserProfile = {
  id: 1,
  userId: 1,
  avatar: defaultCreateProfileDto.avatar,
  bio: defaultCreateProfileDto.bio,
  fullName: defaultCreateProfileDto.fullName,
  birthdate: defaultCreateProfileDto.birthdate,
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
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const defaultProfileWithAssociations = {
  ...defaultMockUserProfile,
  interests: [{ label: { name: 'Web Development' } }],
  languages: [{ language: { code: LanguageCode.EN } }],
  skills: [{ label: { name: 'nestjs' } }],
};

export const defaultE2ECreateProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferred_role: [UserRole.BackendDeveloper],
  location: 'Test Location',
  website: 'https://example.com',
  domain_labels: ['Web Development', 'Cloud Computing'],
  languages: [LanguageCode.EN, LanguageCode.KR],
  technical_labels: ['nestjs', 'typescript', 'postgresql'],
};

export const defaultUpdateProfileDto: UpdateUserProfileDto = {
  domain_labels: ['AI', 'ML'],
  languages: [LanguageCode.EN],
  technical_labels: ['python'],
  preferred_role: [UserRole.DataScientist],
};
