import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../../../../src/modules/mail/mail.service';
import { ConfigService } from '@nestjs/config';

// Mock fetch globally
global.fetch = jest.fn();

describe('MailService', () => {
  let mailService: MailService;
  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    jest.clearAllMocks();
  });

  const verifyFetchCall = (actualCall: any, expectedBody: any) => {
    const [url, options] = actualCall;
    expect(url).toBe('https://api.enveloop.com/messages');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-api-key',
    });
    expect(JSON.parse(options.body)).toEqual(expectedBody);
  };

  const mockMailOptions = {
    to: 'test@example.com',
    from: 'info@thinkstorm.app',
    subject: 'Test Subject',
    template: 'test-template',
    templateVariables: { name: 'Test User' },
  };

  describe('sendMail', () => {
    it('should successfully send an email', async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await mailService.sendMail(mockMailOptions);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      verifyFetchCall(
        (global.fetch as jest.Mock).mock.calls[0],
        mockMailOptions,
      );
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ error: 'API Error' }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockErrorResponse);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await mailService.sendMail(mockMailOptions);

      expect(consoleSpy).toHaveBeenCalledWith('Enveloop error:', {
        error: 'API Error',
      });
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(mailService.sendMail(mockMailOptions)).rejects.toThrow(
        'Network error',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send email:',
        networkError,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should call sendMail with correct welcome email parameters', async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const userEmail = 'test@example.com';
      const userName = 'Test User';

      await mailService.sendWelcomeEmail(userEmail, userName);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      verifyFetchCall((global.fetch as jest.Mock).mock.calls[0], {
        to: userEmail,
        from: 'info@thinkstorm.app',
        template: 'user-welcome',
        subject: 'Welcome to Our Platform!',
        templateVariables: {
          name: userName,
        },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call sendMail with correct password reset parameters', async () => {
      const mockResponse = { ok: true, json: jest.fn() };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const userEmail = 'test@example.com';
      const userName = 'Test User';
      const resetUrl = 'https://example.com/reset';

      await mailService.forgotPassword(userEmail, userName, resetUrl);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      verifyFetchCall((global.fetch as jest.Mock).mock.calls[0], {
        to: userEmail,
        from: 'info@thinkstorm.app',
        template: 'forgot-password',
        subject: 'Password Reset Requested',
        templateVariables: {
          name: userName,
          reset_url: resetUrl,
        },
      });
    });
  });
});
