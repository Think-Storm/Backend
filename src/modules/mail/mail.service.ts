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
      console.error('Failed to send email:', error);
      throw error;
    }
  }

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

  async sendJoinRequestAcceptedEmail(
    userEmail: string,
    projectName: string,
    projectOwner: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      from: 'info@thinkstorm.app',
      template: 'join-request-accepted',
      subject: `Your request to join ${projectName} has been accepted`,
      templateVariables: {
        projectName,
        projectOwner,
      },
    });
  }

  async sendJoinRequestDeclinedEmail(
    userEmail: string,
    projectName: string,
    projectOwner: string,
  ): Promise<void> {
    await this.sendMail({
      to: userEmail,
      from: 'info@thinkstorm.app',
      template: 'join-request-declined',
      subject: `Your request to join ${projectName} has been declined`,
      templateVariables: {
        projectName,
        projectOwner,
      },
    });
  }
}
