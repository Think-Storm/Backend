import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../src/modules/auth/jwt/jwt.guard';
import { mockJwtAuthGuard } from '../utils/mock-jwt-auth-guard';
import * as bcrypt from 'bcrypt';
import {
  defaultWelcomeNotification,
  defaultInviteToProjectNotification,
  createTestNotification,
  createTestNotifications,
} from '../utils/notification.utils';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testUser: User;

  beforeAll(async () => {
    // Create the test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Create a test user
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('testpassword', salt);

    testUser = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        passwordSalt: salt,
        passwordChangedAt: new Date(),
        fullName: 'Test User',
        birthdate: new Date(),
      },
    });

    // Create a new module with the mock guard
    const moduleWithMockGuard = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard(testUser))
      .compile();

    app = moduleWithMockGuard.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    // Clean the notifications table before each test
    await prismaService.notification.deleteMany({
      where: { userId: testUser.id },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.notification.deleteMany({
      where: { userId: testUser.id },
    });
    await prismaService.user.delete({
      where: { id: testUser.id },
    });
    await app.close();
  });

  describe('/notifications (GET)', () => {
    it('should return all notifications for the authenticated user', async () => {
      // Create test notifications
      const notifications = await createTestNotifications(prismaService, [
        { ...defaultWelcomeNotification, userId: testUser.id },
        { ...defaultInviteToProjectNotification, userId: testUser.id },
      ]);

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining(
          notifications.map((notification) => ({
            ...notification,
            createdAt: notification.createdAt.toISOString(),
            lastUpdatedAt: notification.lastUpdatedAt.toISOString(),
          })),
        ),
      );
    });

    it('should return empty array when no notifications are found', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('/notifications/:id (DELETE)', () => {
    it('should delete a notification', async () => {
      // Create a test notification
      const notification = await createTestNotification(prismaService, {
        ...defaultWelcomeNotification,
        userId: testUser.id,
      });

      await request(app.getHttpServer())
        .delete(`/notifications/${notification.id}`)
        .expect(200);

      // Verify the notification was deleted
      const deletedNotification = await prismaService.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deletedNotification).toBeNull();
    });

    it('should return 404 when trying to delete non-existent notification', async () => {
      await request(app.getHttpServer())
        .delete('/notifications/999999')
        .expect(404);
    });
  });

  describe('/notifications (DELETE)', () => {
    it('should delete all notifications for the authenticated user', async () => {
      // Create test notifications
      await createTestNotifications(prismaService, [
        { ...defaultWelcomeNotification, userId: testUser.id },
        { ...defaultInviteToProjectNotification, userId: testUser.id },
      ]);

      const response = await request(app.getHttpServer())
        .delete('/notifications')
        .expect(200);

      expect(response.body).toEqual({ count: 2 });

      // Verify all notifications were deleted
      const remainingNotifications = await prismaService.notification.findMany({
        where: { userId: testUser.id },
      });
      expect(remainingNotifications).toHaveLength(0);
    });

    it('should return count 0 when no notifications are found', async () => {
      const response = await request(app.getHttpServer())
        .delete('/notifications')
        .expect(200);

      expect(response.body).toEqual({ count: 0 });

      // Verify no notifications exist
      const remainingNotifications = await prismaService.notification.findMany({
        where: { userId: testUser.id },
      });
      expect(remainingNotifications).toHaveLength(0);
    });
  });
});
