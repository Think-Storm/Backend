import { LanguageName, UserProfile, UserRole } from '@think-storm/contracts';
import { CreateUserProfileDto } from '../../src/modules/profile/dtos/createUserProfile.dto';
import { UpdateUserProfileDto } from '../../src/modules/profile/dtos/updateUserProfile.dto';

export const defaultCreateProfileDto: CreateUserProfileDto = {
  avatar:
    'https://thinkstorm.s3.ap-northeast-2.amazonaws.com/profile/user123.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferredRole: [UserRole.BackendDeveloper],
  location: 'Test Location',
  timezone: 'Test Timezone',
  websiteType: ['linkedin'],
  website: ['https://example.com'],
  domainLabels: ['Web Development'],
  languages: [LanguageName.English],
  technicalLabels: ['nestjs'],
};

export const defaultProfileResponse = {
  message: 'Create User Profile Success',
  data: {
    id: 1,
    userId: 1,
    fullName: 'Full Name',
    birthdate: new Date('2000-01-01'),
    avatar:
      'https://thinkstorm.s3.ap-northeast-2.amazonaws.com/profile/user123.jpg',
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
  avatar:
    'https://thinkstorm.s3.ap-northeast-2.amazonaws.com/profile/user123.jpg',
  bio: 'Test bio',
  fullName: 'Full Name',
  birthdate: new Date('2000-01-01'),
  preferredRole: [UserRole.BackendDeveloper],
  location: 'Test Location',
  timezone: 'Test Timezone',
  websiteType: ['linkedin'],
  website: ['https://example.com'],
  domainLabels: ['Web Development', 'Cloud Computing'],
  languages: [LanguageName.English, LanguageName.Korean],
  technicalLabels: ['nestjs', 'typescript', 'postgresql'],
};

export const defaultUpdateProfileDto: UpdateUserProfileDto = {
  domainLabels: ['AI', 'ML'],
  languages: [LanguageName.English],
  technicalLabels: ['python'],
  preferredRole: [UserRole.DataScientist],
};
