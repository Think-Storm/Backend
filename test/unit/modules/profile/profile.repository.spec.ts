import { ProfileRepository } from '../../../../src/modules/profile/profile.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';
import {
  defaultCreateProfileDto,
  defaultMockUserProfile,
  defaultProfileWithAssociations,
} from '../../../utils/profile.utils';

describe('ProfileRepository', () => {
  let prismaService: PrismaService;
  let profileRepository: ProfileRepository;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      providers: [ProfileRepository, ConfigService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    profileRepository = module.get<ProfileRepository>(ProfileRepository);

    await prismaService.$connect();
    await refreshDatabase();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('createUserProfile', () => {
    it('should create a user profile with all associations', async () => {
      const userId = 1;

      jest
        .spyOn(prismaService.userProfile, 'create')
        .mockResolvedValue(defaultProfileWithAssociations);

      const result = await profileRepository.createUserProfile(
        userId,
        defaultCreateProfileDto,
      );

      expect(result).toEqual(defaultProfileWithAssociations);
      expect(prismaService.userProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          avatar: defaultCreateProfileDto.avatar,
          bio: defaultCreateProfileDto.bio,
          preferedRole: defaultCreateProfileDto.preferred_role,
          location: defaultCreateProfileDto.location,
          website: defaultCreateProfileDto.website,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getUserProfileByUserId', () => {
    it('should return user profile when it exists', async () => {
      const userId = 1;

      jest
        .spyOn(prismaService.userProfile, 'findUnique')
        .mockResolvedValue(defaultMockUserProfile);

      const result = await profileRepository.getUserProfileByUserId(userId);

      expect(result).toEqual(defaultMockUserProfile);
      expect(prismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return null when profile does not exist', async () => {
      const userId = 999;

      jest
        .spyOn(prismaService.userProfile, 'findUnique')
        .mockResolvedValue(null);

      const result = await profileRepository.getUserProfileByUserId(userId);

      expect(result).toBeNull();
      expect(prismaService.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
