import { UserRepository } from '../../../../src/modules/user/user.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultCreateUserDto } from './user.utils';
import { defaultPasswordSalt } from '../../common/passwordEncryption.utils';

describe('UserRepository', () => {
  let prismaService: PrismaService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, UserRepository],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    userRepository = module.get<UserRepository>(UserRepository);

    await prismaService.$connect();
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  afterEach(async () => {
    await prismaService.user.deleteMany();
  });

  describe('createUser function', () => {
    it('should create a new user in DB', async () => {
      const user = await userRepository.createUser(
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

  describe('getUserByEmail function', () => {
    it('should retrieve a user in DB with email', async () => {
      // Create a User in DB to fetch
      await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const user = await userRepository.getUserByEmail(
        defaultCreateUserDto.email,
      );

      expect(user).toBeDefined();
      expect(user.email).toBe(defaultCreateUserDto.email);
    });

    it('should not retrieve a user in DB if there is no user with email', async () => {
      // Create a User in DB with a different email
      await userRepository.createUser(
        defaultCreateUserDto,
        defaultPasswordSalt,
      );

      const fakeEmail = 'fakeEmail@email.com';
      const user = await userRepository.getUserByEmail(fakeEmail);

      expect(user).toBeNull();
    });
  });
});
