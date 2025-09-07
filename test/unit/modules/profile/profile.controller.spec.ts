import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../../../src/modules/profile/profile.controller';
import { ProfileService } from '../../../../src/modules/profile/profile.service';
import { UpdateUserProfileDto } from '../../../../src/modules/profile/dtos/updateUserProfile.dto';
import {
  defaultCreateProfileDto,
  defaultMockUser,
  defaultMockUserProfile,
  defaultProfileWithAssociations,
} from '../../../utils/profile.utils';
import { mockJwtToken } from '../../../utils/jwt.utils';
import { createAuthHeader } from '../../../utils/auth.utils';
import { LanguageName, UserRole } from '@think-storm/contracts';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    createUserProfile: jest.fn(),
    getProfileById: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
  };

  const mockRequest = {
    user: defaultMockUserProfile,
    headers: createAuthHeader(mockJwtToken),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    const userId = defaultMockUser.id;

    it('should create a profile successfully', async () => {
      mockProfileService.createUserProfile.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await controller.createUserProfile(
        userId,
        defaultCreateProfileDto,
        mockRequest.user,
      );

      expect(result).toEqual({
        message: 'Create User Profile Success',
        data: defaultMockUserProfile,
      });
      expect(mockProfileService.createUserProfile).toHaveBeenCalledWith(
        userId,
        defaultCreateProfileDto,
        defaultMockUserProfile.id,
      );
    });
  });

  describe('getProfile', () => {
    const profileId = defaultMockUserProfile.id;

    it('should get a profile successfully', async () => {
      mockProfileService.getProfileById.mockResolvedValue(
        defaultProfileWithAssociations,
      );

      const result = await controller.getProfile(profileId, mockRequest.user);

      expect(result).toEqual({
        message: 'Get User Profile Success',
        data: defaultProfileWithAssociations,
      });
      expect(mockProfileService.getProfileById).toHaveBeenCalledWith(
        profileId,
        defaultMockUserProfile.id,
      );
    });
  });

  describe('updateProfile', () => {
    const profileId = defaultMockUserProfile.id;
    const updateProfileDto: UpdateUserProfileDto = {
      domainLabels: ['AI', 'ML'],
      languages: [LanguageName.English],
      technicalLabels: ['Python'],
      preferredRole: [UserRole.DataScientist],
    };

    it('should update a profile successfully', async () => {
      const updatedProfile = {
        ...defaultMockUserProfile,
        ...updateProfileDto,
      };

      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        profileId,
        updateProfileDto,
        mockRequest.user,
      );

      expect(result).toEqual({
        message: 'Update User Profile Success',
        data: updatedProfile,
      });
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        profileId,
        updateProfileDto,
        defaultMockUserProfile.id,
      );
    });
  });

  describe('deleteProfile', () => {
    const profileId = defaultMockUserProfile.id;

    it('should delete a profile successfully', async () => {
      mockProfileService.deleteProfile.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await controller.deleteProfile(
        profileId,
        mockRequest.user,
      );

      expect(result).toEqual({
        message: 'Delete User Profile Success',
        data: defaultMockUserProfile,
      });
      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith(
        profileId,
        defaultMockUserProfile.id,
      );
    });
  });
});
