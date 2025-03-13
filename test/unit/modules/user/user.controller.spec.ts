import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpMocks = require('node-mocks-http');

import { UserController } from '../../../../src/modules/user/user.controller';
import { UserService } from '../../../../src/modules/user/user.service';
import { UserRepository } from '../../../../src/modules/user/user.repository';
import { UserMapper } from '../../../../src/modules/user/dtos/user.mapper';
import { PasswordEncryption } from '../../../../src/common/encryption/passwordEncryption';
import {
  defaultUserResponseDto,
  defaultUpdateUser1Dto,
} from '../../../utils/user.utils';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import prisma from '../../../../src/prisma/prisma.client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import refreshDatabase from '../../../../src/prisma/prisma.dbreset';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import {
  createAuthHeader,
  mockGuardContext,
} from '../../../../test/utils/auth.utils';
import { JwtAuthGuard } from '../../../../src/modules/auth/jwt/jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import {
  createMockRequestWithUser,
  mockJwtToken,
} from '../../../../test/utils/jwt.utils';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let authService: AuthService;

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prisma)],
      controllers: [UserController],
      providers: [
        AuthService,
        UserService,
        UserRepository,
        UserMapper,
        PasswordEncryption,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        ConfigService,
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

    userController = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);
    authService = app.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await refreshDatabase();
  });

  describe('getUser function', () => {
    it('should return a searched user responseDto', async () => {
      const mainSpy = jest
        .spyOn(userService, 'getUserById')
        .mockResolvedValue(defaultUserResponseDto);

      const response = await userController.getUserById(
        defaultUserResponseDto.id,
      );

      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(defaultUserResponseDto.id);
      expect(response).toBe(defaultUserResponseDto);
    });

    it('should throw an error if user is not found', async () => {
      jest.spyOn(userService, 'getUserById').mockImplementation(() => {
        throw ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', '999'),
        );
      });

      await expect(userController.getUserById(999)).rejects.toThrow(
        ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND('User', '999'),
        ),
      );
    });
  });

  describe('updateUserById function', () => {
    it('should return a modified user responseDto', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);

      const res = httpMocks.createResponse();

      const mainSpy = jest
        .spyOn(userService, 'updateUserById')
        .mockResolvedValue(defaultUserResponseDto);

      // Mock the authentication method to return a UserResponseDto
      jest
        .spyOn(authService, 'authentication')
        .mockImplementation((user, response) => {
          response.cookie('jwt', 'test-token', { httpOnly: true });
          return {
            ...user,
            token: 'test-token', // Include the token in the UserResponseDto
          };
        });

      await userController.updateUserById(
        defaultUpdateUser1Dto,
        mockRequest,
        res,
      );

      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(
        defaultUpdateUser1Dto,
        defaultUserResponseDto.id,
      );

      // Check the response data in the mock response object
      const responseData = res._getData();
      expect(responseData).toEqual({
        message: 'Update User Success',
        data: {
          ...defaultUserResponseDto,
          token: 'test-token', // Ensure the token is part of the response data
        },
      });
    });

    it('should throw an error if update fails', async () => {
      // Setup
      const mockRequest = createMockRequestWithUser(
        defaultUserResponseDto,
      ) as any;
      mockRequest.headers = createAuthHeader(mockJwtToken);

      const res = httpMocks.createResponse();

      jest
        .spyOn(userService, 'updateUserById')
        .mockRejectedValue(new ServiceException('Update failed', 400));

      await expect(
        userController.updateUserById(defaultUpdateUser1Dto, mockRequest, res),
      ).rejects.toThrow('Update failed');
    });
  });
});
