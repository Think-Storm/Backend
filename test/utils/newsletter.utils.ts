import { NewsletterSubscription } from '@think-storm/contracts';
import { CreateNewsletterSubscriptionDto } from '../../src/modules/newsletter/dtos/createNewsletterSubscription.dto';
import { NewsletterSubscriptionResponseDto } from '../../src/modules/newsletter/dtos/newsletterSubscriptionResponse.dto';

export const defaultCreateNewsletterSubscriptionDto: CreateNewsletterSubscriptionDto =
  {
    email: 'test@example.com',
  };

export const invalidEmailNewsletterSubscriptionDto: CreateNewsletterSubscriptionDto =
  {
    email: 'invalid-email',
  };

export const existingEmailNewsletterSubscriptionDto: CreateNewsletterSubscriptionDto =
  {
    email: 'existing@example.com',
  };

export const defaultNewsletterSubscriptionResponseDto: NewsletterSubscriptionResponseDto =
  {
    email: 'test@example.com',
    id: 1,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
  };

export const defaultNewsletterSubscription: NewsletterSubscription = {
  email: 'test@example.com',
  id: 1,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};
