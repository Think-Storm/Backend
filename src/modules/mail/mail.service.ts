import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Enveloop } from 'enveloop';

interface SendMailOptions {
  to: string;
  from?: string;
  subject: string;
  template: string;
  templateVariables?: Record<string, any>;
}

@Injectable()
export class MailService {
  private enveloopClient: any;

  constructor(private configService: ConfigService) {
    this.enveloopClient = new Enveloop({
      apiKey: this.configService.get<string>('ENVELOOP_API_KEY'),
    });
  }

  /**
   * Sends an email using Enveloop
   */
  async sendMail({
    to,
    from,
    subject,
    template,
    templateVariables,
  }: SendMailOptions): Promise<any> {
    try {
      const response = await fetch('https://api.enveloop.com/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.enveloopClient.apiKey}`,
        },
        body: JSON.stringify({
          to,
          template,
          subject,
          from,
          templateVariables,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Enveloop error:', errorData);
      }

      return response;
    } catch (error) {
      // Log the error and rethrow
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Sends a welcome email to a new user
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    await this.sendMail({
      to: userEmail,
      from: 'info@thinkstorm.app',
      template: 'user-welcome',
      subject: 'Welcome to Our Platform!',
      templateVariables: {
        name: userName,
      },
    });
  }

  /**
   * Send Forgot Password Link to a user
   */
  async forgotPassword(
    userEmail: string,
    userName: string,
    passwordResetUrl: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      from: 'info@thinkstorm.app',
      template: 'forgot-password',
      subject: 'Password Reset Requested',
      templateVariables: {
        name: userName,
        reset_url: passwordResetUrl,
      },
    });
  }
}
