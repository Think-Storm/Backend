import { UserProfile } from '@prisma/client';
import { LanguageName, UserRole } from '@think-storm/contracts';
import { CreateUserProfileDto } from '../../src/modules/profile/dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from '../../src/modules/profile/dtos/updateUserProfile.dto';

export const defaultCreateProfileDto: CreateUserProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferred_role: [UserRole.BackendDeveloper],
  location: 'Test Location',
  timezone: 'Test Timezone',
  websiteType: ['linkedin'],
  website: ['https://example.com'],
  domain_labels: ['Web Development'],
  languages: [LanguageName.English],
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
    domainLabels: ['Web Development'],
    technicalLabels: ['nestjs'],
    languages: [LanguageName.English],
    preferredRole: [UserRole.BackendDeveloper],
    location: 'Test Location',
    timezone: 'Test Timezone',
    websiteType: ['linkedin'],
    website: ['https://example.com'],
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
  timezone: defaultCreateProfileDto.timezone,
  websiteType: defaultCreateProfileDto.websiteType,
  website: defaultCreateProfileDto.website,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
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
  domainLabels: ['Web Development'],
  technicalLabels: ['nestjs'],
  languages: [{ languageName: LanguageName.English }],
  preferredRole: [{ roleName: UserRole.DataScientist }],
};

export const defaultE2ECreateProfileDto = {
  avatar: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferred_role: [UserRole.BackendDeveloper],
  location: 'Test Location',
  timezone: 'Test Timezone',
  websiteType: ['linkedin'],
  website: ['https://example.com'],
  domain_labels: ['Web Development', 'Cloud Computing'],
  languages: [LanguageName.English, LanguageName.Korean],
  technical_labels: ['nestjs', 'typescript', 'postgresql'],
};

export const defaultUpdateProfileDto: UpdateUserProfileDto = {
  domain_labels: ['AI', 'ML'],
  languages: [LanguageName.English],
  technical_labels: ['python'],
  preferred_role: [UserRole.DataScientist],
};
