import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  MailService,
  MAIL_TIMEOUT_MS,
} from '../../../../src/modules/mail/mail.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('MailService', () => {
  let mailService: MailService;

  const FROM = 'info@thinkstorm.app';
  const TO = 'test@example.com';

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'RESEND_API_KEY') return 'mock-api-key';
      if (key === 'MAIL_FROM') return FROM;
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    jest.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendMail', () => {
    it('sends through Resend using the configured sender', async () => {
      const result = await mailService.sendMail({
        to: TO,
        subject: 'Test Subject',
        html: '<p>hello</p>',
      });

      expect(mockSend).toHaveBeenCalledWith({
        from: FROM,
        to: TO,
        subject: 'Test Subject',
        html: '<p>hello</p>',
      });
      expect(result).toEqual({ id: 'msg_1' });
    });

    it('lets an explicit sender override the configured default', async () => {
      await mailService.sendMail({
        to: TO,
        from: 'other@thinkstorm.app',
        subject: 'Test Subject',
        html: '<p>hello</p>',
      });

      expect(mockSend.mock.calls[0][0].from).toBe('other@thinkstorm.app');
    });

    it('raises instead of swallowing a rejection reported in the body', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { name: 'validation_error', message: 'Domain not verified' },
      });

      await expect(
        mailService.sendMail({ to: TO, subject: 's', html: '<p>h</p>' }),
      ).rejects.toBeInstanceOf(ServiceException);
    });

    it('raises on a transport failure', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      await expect(
        mailService.sendMail({ to: TO, subject: 's', html: '<p>h</p>' }),
      ).rejects.toBeInstanceOf(ServiceException);
    });

    it('gives up rather than hanging when Resend never responds', async () => {
      jest.useFakeTimers();
      mockSend.mockReturnValue(new Promise(() => undefined));

      const pending = mailService.sendMail({
        to: TO,
        subject: 's',
        html: '<p>h</p>',
      });
      const assertion = expect(pending).rejects.toBeInstanceOf(ServiceException);

      jest.advanceTimersByTime(MAIL_TIMEOUT_MS);
      await assertion;

      jest.useRealTimers();
    });
  });

  describe('forgotPassword', () => {
    it('sends the reset link in the rendered body', async () => {
      const resetUrl = 'https://example.com/reset-password?token=abc';

      await mailService.forgotPassword(TO, 'Test User', resetUrl);

      const payload = mockSend.mock.calls[0][0];
      expect(payload.to).toBe(TO);
      expect(payload.subject).toBe('Password Reset Requested');
      expect(payload.html).toContain(resetUrl);
      expect(payload.html).toContain('Test User');
    });

    it('escapes a display name so it cannot inject markup', async () => {
      await mailService.forgotPassword(
        TO,
        '<script>alert(1)</script>',
        'https://example.com/reset',
      );

      const { html } = mockSend.mock.calls[0][0];
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('sends the welcome subject and greets the user', async () => {
      await mailService.sendWelcomeEmail(TO, 'Test User');

      const payload = mockSend.mock.calls[0][0];
      expect(payload.subject).toBe('Welcome to Our Platform!');
      expect(payload.html).toContain('Test User');
    });
  });

  describe('join request emails', () => {
    it('names the project and owner when accepted', async () => {
      await mailService.sendJoinRequestAcceptedEmail(TO, 'Apollo', 'Ada');

      const payload = mockSend.mock.calls[0][0];
      expect(payload.subject).toBe(
        'Your request to join Apollo has been accepted',
      );
      expect(payload.html).toContain('Apollo');
      expect(payload.html).toContain('Ada');
    });

    it('names the project and owner when declined', async () => {
      await mailService.sendJoinRequestDeclinedEmail(TO, 'Apollo', 'Ada');

      expect(mockSend.mock.calls[0][0].subject).toBe(
        'Your request to join Apollo has been declined',
      );
    });
  });
});
