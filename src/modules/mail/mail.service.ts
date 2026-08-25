import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';
import {
  forgotPasswordEmail,
  joinRequestAcceptedEmail,
  joinRequestDeclinedEmail,
  welcomeEmail,
} from './mail.templates';

export const MAIL_TIMEOUT_MS = 10000;

interface SendMailOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly defaultFrom: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.defaultFrom = this.configService.get<string>('MAIL_FROM');
  }

  async sendMail({ to, from, subject, html }: SendMailOptions): Promise<any> {
    // The Resend SDK exposes no timeout option, so cap how long we are willing
    // to wait. This stops the caller hanging; it does not abort the request.
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Resend request timed out after ${MAIL_TIMEOUT_MS}ms`)),
        MAIL_TIMEOUT_MS,
      );
    });

    try {
      const result = await Promise.race([
        this.resend.emails.send({
          from: from ?? this.defaultFrom,
          to,
          subject,
          html,
        }),
        timeout,
      ]);

      // Resend reports delivery failures in the body rather than by throwing.
      // These used to be logged and swallowed, which made every failed send
      // invisible — surface them instead.
      if (result?.error) {
        this.logger.error(
          `Resend rejected message to ${to}: ${result.error.name} - ${result.error.message}`,
        );
        throw new ServiceException(
          errorMessages.EMAIL_SEND_FAILED,
          502,
          result.error,
        );
      }

      return result?.data;
    } catch (error) {
      if (error instanceof ServiceException) throw error;
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new ServiceException(errorMessages.EMAIL_SEND_FAILED, 502, error);
    } finally {
      clearTimeout(timer);
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.sendMail({
      to: userEmail,
      subject: 'Welcome to Our Platform!',
      html: welcomeEmail(userName),
    });
  }

  async forgotPassword(
    userEmail: string,
    userName: string,
    passwordResetUrl: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      subject: 'Password Reset Requested',
      html: forgotPasswordEmail(userName, passwordResetUrl),
    });
  }

  async sendJoinRequestAcceptedEmail(
    userEmail: string,
    projectName: string,
    projectOwner: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      subject: `Your request to join ${projectName} has been accepted`,
      html: joinRequestAcceptedEmail(projectName, projectOwner),
    });
  }

  async sendJoinRequestDeclinedEmail(
    userEmail: string,
    projectName: string,
    projectOwner: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      subject: `Your request to join ${projectName} has been declined`,
      html: joinRequestDeclinedEmail(projectName, projectOwner),
    });
  }
}
