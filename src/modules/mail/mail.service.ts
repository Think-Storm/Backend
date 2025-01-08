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
      const response = await this.enveloopClient.sendMessage({
        to,
        from,
        subject,
        template,
        templateVariables,
      });

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
      template: 'welcome-email', // Template slug created in Enveloop
      subject: 'Welcome to Our Platform!',
      templateVariables: {
        name: userName,
      },
    });
  }
}
