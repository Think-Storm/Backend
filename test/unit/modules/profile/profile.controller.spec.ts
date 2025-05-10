import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../../../src/modules/profile/profile.controller';
import { ProfileService } from '../../../../src/modules/profile/profile.service';
import { ProfileRepository } from '../../../../src/modules/profile/profile.repository';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt/jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import { mockGuardContext } from '../../../../test/utils/auth.utils';
import { defaultUserResponseDto } from '../../../utils/user.utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  defaultCreateProfileDto,
  defaultProfileResponse,
} from '../../../utils/profile.utils';

describe('ProfileController', () => {
  let profileController: ProfileController;
  let profileService: ProfileService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        ProfileService,
        ProfileRepository,
        UserRepository,
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'DATABASE_URL':
                  return 'postgresql://test:test@localhost:5432/test';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context = mockGuardContext(defaultUserResponseDto);
          const request = context.switchToHttp().getRequest();
          request['user'] = { id: defaultUserResponseDto.id };
          return true;
        },
      })
      .compile();

    profileController = app.get<ProfileController>(ProfileController);
    profileService = app.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('should create a user profile', async () => {
      const userId = 1;
      const mockRequest = {
        user: { id: userId },
      };

      jest
        .spyOn(profileService, 'createUserProfile')
        .mockResolvedValue(defaultProfileResponse.data);

      const result = await profileController.createUserProfile(
        userId,
        defaultCreateProfileDto,
        mockRequest,
      );
      expect(result).toEqual(defaultProfileResponse);
    });
  });
});
