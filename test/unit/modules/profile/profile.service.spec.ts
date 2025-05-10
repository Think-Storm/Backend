import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../../../../src/modules/profile/profile.service';
import { ProfileRepository } from '../../../../src/modules/profile/profile.repository';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import {
  defaultCreateProfileDto,
  defaultMockUser,
  defaultMockUserProfile,
} from '../../../utils/profile.utils';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let profileRepository: ProfileRepository;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: ProfileRepository,
          useValue: {
            createUserProfile: jest.fn(),
            getUserProfileByUserId: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            getUserById: jest.fn(),
          },
        },
      ],
    }).compile();

    profileService = module.get<ProfileService>(ProfileService);
    profileRepository = module.get<ProfileRepository>(ProfileRepository);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('should create a user profile successfully', async () => {
      jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultMockUser);
      jest
        .spyOn(profileRepository, 'getUserProfileByUserId')
        .mockResolvedValue(null);
      jest
        .spyOn(profileRepository, 'createUserProfile')
        .mockResolvedValue(defaultMockUserProfile);

      const result = await profileService.createUserProfile(
        1,
        defaultCreateProfileDto,
        1,
      );

      expect(result).toEqual(defaultMockUserProfile);
      expect(userRepository.getUserById).toHaveBeenCalledWith(1);
      expect(profileRepository.getUserProfileByUserId).toHaveBeenCalledWith(1);
      expect(profileRepository.createUserProfile).toHaveBeenCalledWith(
        1,
        defaultCreateProfileDto,
      );
    });

    it('should throw ForbiddenException when creating profile for another user', async () => {
      await expect(
        profileService.createUserProfile(1, defaultCreateProfileDto, 2),
      ).rejects.toThrow(
        ServiceException.ForbiddenException(
          errorMessages.FORBIDDEN(
            'You can only create a profile for your own user account',
          ),
        ),
      );
    });

    it('should throw EntityNotFoundException when user does not exist', async () => {
      jest.spyOn(userRepository, 'getUserById').mockResolvedValue(null);

      await expect(
        profileService.createUserProfile(1, defaultCreateProfileDto, 1),
      ).rejects.toThrow(
        ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', '1'),
        ),
      );
    });

    it('should throw BadRequestException when profile already exists', async () => {
      jest
        .spyOn(userRepository, 'getUserById')
        .mockResolvedValue(defaultMockUser);
      jest
        .spyOn(profileRepository, 'getUserProfileByUserId')
        .mockResolvedValue(defaultMockUserProfile);

      await expect(
        profileService.createUserProfile(1, defaultCreateProfileDto, 1),
      ).rejects.toThrow(
        ServiceException.BadRequestException(
          'User profile already exists. Use update endpoint instead.',
        ),
      );
    });
  });
});
