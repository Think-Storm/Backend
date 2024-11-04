import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { defaultCreateUserDto } from '../user/user.utils';
import { AuthRepository } from '../../../../src/modules/auth/auth.repository';

describe('AuthRepository', () => {
  let prismaService: PrismaService;
  let authRepository: AuthRepository;
  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [AuthRepository, ConfigService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    authRepository = module.get<AuthRepository>(AuthRepository);

    await prismaService.$connect();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
  });

  describe('createUser function', () => {
    it('should create a new user in DB', async () => {
      const user = await authRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      expect(user).toHaveProperty('id');
      expect(user.createdAt).toBeDefined();
      expect(user.lastUpdatedAt).toBeDefined();
      expect(user.username).toBe(defaultCreateUserDto.username);
      expect(user.fullName).toBe(defaultCreateUserDto.fullName);
      expect(user.email).toBe(defaultCreateUserDto.email);
      expect(user.password).toBe(defaultCreateUserDto.password);
      expect(user.birthdate.toDateString()).toBe(
        defaultCreateUserDto.birthdate.toDateString(),
      );
      expect(user.bio).toBe(defaultCreateUserDto.bio);
      expect(user.passwordSalt).toBe(defaultPasswordSalt);
    });
  });
});
