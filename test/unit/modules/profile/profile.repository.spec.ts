import { Test, TestingModule } from '@nestjs/testing';
import { ProfileRepository } from '../../../../src/modules/profile/profile.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import {
  defaultCreateProfileDto,
  defaultMockUser,
  defaultMockUserProfile,
  defaultProfileWithAssociations,
  defaultUpdateProfileDto,
} from '../../../utils/profile.utils';

const mockPrismaService = {
  userProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProfileRepository', () => {
  let repository: ProfileRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ProfileRepository>(ProfileRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    const userId = defaultMockUser.id;

    it('should create a user profile successfully', async () => {
      mockPrismaService.userProfile.create.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await repository.createUserProfile(
        userId,
        defaultCreateProfileDto,
      );

      expect(result).toEqual(defaultMockUserProfile);
      expect(mockPrismaService.userProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ServiceException when creation fails', async () => {
      const error = new Error('Database error');
      mockPrismaService.userProfile.create.mockRejectedValue(error);

      await expect(
        repository.createUserProfile(userId, defaultCreateProfileDto),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('getProfileById', () => {
    const profileId = defaultMockUserProfile.id;

    it('should return a profile when it exists', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(
        defaultProfileWithAssociations,
      );

      const result = await repository.getProfileById(profileId);

      expect(result).toEqual(defaultProfileWithAssociations);
      expect(mockPrismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { id: profileId },
        include: expect.any(Object),
      });
    });

    it('should return null when profile does not exist', async () => {
      mockPrismaService.userProfile.findUnique.mockResolvedValue(null);

      const result = await repository.getProfileById(profileId);

      expect(result).toBeNull();
    });

    it('should throw ServiceException when query fails', async () => {
      const error = new Error('Database error');
      mockPrismaService.userProfile.findUnique.mockRejectedValue(error);

      await expect(repository.getProfileById(profileId)).rejects.toThrow(
        ServiceException,
      );
    });
  });

  describe('updateProfile', () => {
    const profileId = defaultMockUserProfile.id;

    it('should update a profile successfully', async () => {
      const updatedProfile = {
        ...defaultMockUserProfile,
        ...defaultUpdateProfileDto,
      };

      mockPrismaService.userProfile.update.mockResolvedValue(updatedProfile);

      const result = await repository.updateProfile(
        profileId,
        defaultUpdateProfileDto,
      );

      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.userProfile.update).toHaveBeenCalledWith({
        where: { id: profileId },
        data: {
          preferredRole: {
            deleteMany: {},
            create: defaultUpdateProfileDto.preferred_role.map((roleName) => ({
              roleName,
            })),
          },
          interests: {
            deleteMany: {},
            create: defaultUpdateProfileDto.domain_labels.map((labelName) => ({
              labelName,
            })),
          },
          languages: {
            deleteMany: {},
            create: defaultUpdateProfileDto.languages.map((name) => ({
              language: {
                connect: { name },
              },
            })),
          },
          skills: {
            deleteMany: {},
            create: defaultUpdateProfileDto.technical_labels.map(
              (labelName) => ({
                labelName,
              }),
            ),
          },
        },
        include: {
          interests: {
            include: {
              label: true,
            },
          },
          languages: {
            include: {
              language: true,
            },
          },
          skills: {
            include: {
              label: true,
            },
          },
          preferredRole: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should throw ServiceException when update fails', async () => {
      const error = new Error('Database error');
      const profileId = defaultMockUserProfile.id;
      mockPrismaService.userProfile.update.mockRejectedValue(error);

      await expect(
        repository.updateProfile(profileId, defaultUpdateProfileDto),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('deleteProfile', () => {
    const profileId = defaultMockUserProfile.id;

    it('should delete a profile successfully', async () => {
      mockPrismaService.userProfile.delete.mockResolvedValue(
        defaultMockUserProfile,
      );

      const result = await repository.deleteProfile(profileId);

      expect(result).toEqual(defaultMockUserProfile);
      expect(mockPrismaService.userProfile.delete).toHaveBeenCalledWith({
        where: { id: profileId },
      });
    });

    it('should throw ServiceException when deletion fails', async () => {
      const error = new Error('Database error');
      mockPrismaService.userProfile.delete.mockRejectedValue(error);

      await expect(repository.deleteProfile(profileId)).rejects.toThrow(
        ServiceException,
      );
    });

    it('should throw ServiceException on error', async () => {
      const userId = 1;
      jest
        .spyOn(mockPrismaService.userProfile, 'findUnique')
        .mockRejectedValue(new Error('DB error'));

      await expect(repository.getUserProfileByUserId(userId)).rejects.toThrow();
    });
  });
});
