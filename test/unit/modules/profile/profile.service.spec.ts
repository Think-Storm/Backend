import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../../../src/modules/profile/profile.service';
import { ProfileRepository } from '../../../../src/modules/profile/profile.repository';
import { ProfileMapper } from '../../../../src/modules/profile/dtos/profile.mapper';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UpdateUserProfileDto } from '../../../../src/modules/profile/dtos/updateUserProfile.dto';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import {
  defaultCreateProfileDto,
  defaultMockUser,
  defaultMockUserProfile,
  defaultProfileWithAssociations,
} from '../../../utils/profile.utils';
import { LanguageName, UserRole } from '@think-storm/contracts';
import { ProfileResponseDto } from '../../../../src/modules/profile/dtos/profileResponse.dto';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockProfileRepository = {
    createUserProfile: jest.fn(),
    getProfileById: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    getUserProfileByUserId: jest.fn(),
  };

  const mockUserRepository = {
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        ProfileMapper,
        {
          provide: ProfileRepository,
          useValue: mockProfileRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    const userId = defaultMockUser.id;
    const requestUserId = defaultMockUser.id;

    it('should create a profile successfully', async () => {
      mockUserRepository.getUserById.mockResolvedValue(defaultMockUser);
      mockProfileRepository.getUserProfileByUserId.mockResolvedValue(null);
      mockProfileRepository.createUserProfile.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await service.createUserProfile(
        userId,
        defaultCreateProfileDto,
        requestUserId,
      );

      expect(result).toEqual(defaultMockUserProfile);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockProfileRepository.createUserProfile).toHaveBeenCalledWith(
        userId,
        defaultCreateProfileDto,
      );
    });

    it('should throw ForbiddenException when creating profile for another user', async () => {
      const differentUserId = 2;

      await expect(
        service.createUserProfile(
          differentUserId,
          defaultCreateProfileDto,
          requestUserId,
        ),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw EntityNotFoundException when user does not exist', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);

      await expect(
        service.createUserProfile(
          userId,
          defaultCreateProfileDto,
          requestUserId,
        ),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw BadRequestException when profile already exists', async () => {
      mockUserRepository.getUserById.mockResolvedValue(defaultMockUser);
      mockProfileRepository.getUserProfileByUserId.mockResolvedValue(
        defaultMockUserProfile,
      );

      await expect(
        service.createUserProfile(
          userId,
          defaultCreateProfileDto,
          requestUserId,
        ),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('getProfileById', () => {
    const profileId = defaultMockUserProfile.id;
    const requestUserId = defaultMockUser.id;

    it('should return profile when it exists and belongs to user', async () => {
      mockProfileRepository.getProfileById.mockResolvedValue(
        defaultProfileWithAssociations,
      );

      const result = await service.getProfileById(profileId, requestUserId);

      const expectedProfileResponse: ProfileResponseDto = {
        ...defaultProfileWithAssociations,
        languages: [LanguageName.English],
        preferredRole: [UserRole.DataScientist],
        createdAt: expect.any(Date),
        lastUpdatedAt: expect.any(Date),
      };
      expect(result).toEqual(expectedProfileResponse);
      expect(mockProfileRepository.getProfileById).toHaveBeenCalledWith(
        profileId,
      );
    });

    it('should throw EntityNotFoundException when profile does not exist', async () => {
      mockProfileRepository.getProfileById.mockResolvedValue(null);

      await expect(
        service.getProfileById(profileId, requestUserId),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw ForbiddenException when accessing another user profile', async () => {
      const mockProfile = {
        ...defaultMockUserProfile,
        userId: 2, // Different from requestUserId
      };

      mockProfileRepository.getProfileById.mockResolvedValue(mockProfile);

      await expect(
        service.getProfileById(profileId, requestUserId),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('updateProfile', () => {
    const profileId = defaultMockUserProfile.id;
    const requestUserId = defaultMockUser.id;
    const updateProfileDto: UpdateUserProfileDto = {
      domain_labels: ['AI', 'ML'],
      languages: [LanguageName.English],
      technical_labels: ['Python'],
      preferred_role: [UserRole.DataScientist],
    };

    it('should update profile successfully', async () => {
      const updatedProfile = {
        ...defaultMockUserProfile,
        domainLabels: ['AI', 'ML'],
        languages: [{ languageName: LanguageName.English }],
        technicalLabels: ['Python'],
        preferredRole: [{ roleName: UserRole.DataScientist }],
      };

      const expectedProfileResponse: ProfileResponseDto = {
        ...updatedProfile,
        languages: [LanguageName.English],
        preferredRole: [UserRole.DataScientist],
      };

      mockProfileRepository.getProfileById.mockResolvedValue(
        defaultMockUserProfile,
      );
      mockProfileRepository.updateProfile.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(
        profileId,
        updateProfileDto,
        requestUserId,
      );

      expect(result).toEqual(expectedProfileResponse);
      expect(mockProfileRepository.updateProfile).toHaveBeenCalledWith(
        profileId,
        updateProfileDto,
      );
    });

    it('should throw EntityNotFoundException when profile does not exist', async () => {
      mockProfileRepository.getProfileById.mockResolvedValue(null);

      await expect(
        service.updateProfile(profileId, updateProfileDto, requestUserId),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw ForbiddenException when updating another user profile', async () => {
      const mockProfile = {
        ...defaultMockUserProfile,
        userId: 2, // Different from requestUserId
      };

      mockProfileRepository.getProfileById.mockResolvedValue(mockProfile);

      await expect(
        service.updateProfile(profileId, updateProfileDto, requestUserId),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('deleteProfile', () => {
    const profileId = defaultMockUserProfile.id;
    const requestUserId = defaultMockUser.id;

    it('should delete profile successfully', async () => {
      mockProfileRepository.getProfileById.mockResolvedValue(
        defaultMockUserProfile,
      );
      mockProfileRepository.deleteProfile.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await service.deleteProfile(profileId, requestUserId);

      expect(result).toEqual(defaultMockUserProfile);
      expect(mockProfileRepository.deleteProfile).toHaveBeenCalledWith(
        profileId,
      );
    });

    it('should throw EntityNotFoundException when profile does not exist', async () => {
      mockProfileRepository.getProfileById.mockResolvedValue(null);

      await expect(
        service.deleteProfile(profileId, requestUserId),
      ).rejects.toThrow(ServiceException);
    });

    it('should throw ForbiddenException when deleting another user profile', async () => {
      const mockProfile = {
        ...defaultMockUserProfile,
        userId: 2, // Different from requestUserId
      };

      mockProfileRepository.getProfileById.mockResolvedValue(mockProfile);

      await expect(
        service.deleteProfile(profileId, requestUserId),
      ).rejects.toThrow(ServiceException);
    });
  });
});
