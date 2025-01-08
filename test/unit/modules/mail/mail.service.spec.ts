import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../../../src/modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';

// Create a mock instance that we can control
const mockSendMessage = jest.fn().mockResolvedValue({
  success: true,
  messageId: 'mock-message-id',
});

// Mock Enveloop client
jest.mock('enveloop', () => ({
  Enveloop: jest.fn().mockImplementation(() => ({
    sendMessage: mockSendMessage,
  })),
}));

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('sendMail', () => {
    const mockMailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      templateVariables: { name: 'Test User' },
    };

    it('should successfully send an email', async () => {
      const result = await mailService.sendMail(mockMailOptions);

      expect(mockSendMessage).toHaveBeenCalledWith(mockMailOptions);
      expect(result).toEqual({
        success: true,
        messageId: 'mock-message-id',
      });
    });

    it('should throw an error when email sending fails', async () => {
      const errorMessage = 'Failed to send email';
      jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error

      // Mock the rejection
      mockSendMessage.mockRejectedValueOnce(new Error(errorMessage));

      await expect(mailService.sendMail(mockMailOptions)).rejects.toThrow(
        errorMessage,
      );
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error),
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct template and variables', async () => {
      const userEmail = 'test@example.com';
      const userName = 'Test User';

      await mailService.sendWelcomeEmail(userEmail, userName);

      expect(mockSendMessage).toHaveBeenCalledWith({
        to: userEmail,
        template: 'welcome-email',
        subject: 'Welcome to Our Platform!',
        templateVariables: {
          name: userName,
        },
      });
    });

    it('should throw error when welcome email fails', async () => {
      const errorMessage = 'Failed to send welcome email';
      jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error

      // Mock the rejection
      mockSendMessage.mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        mailService.sendWelcomeEmail('test@example.com', 'Test User'),
      ).rejects.toThrow(errorMessage);
    });
  });
});
