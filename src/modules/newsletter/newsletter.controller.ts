import { NewsletterService } from './newsletter.service';
import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { CreateNewsletterSubscriptionDto } from './dtos/createNewsletterSubscription.dto';
import { NewsletterSubscriptionResponseDto } from './dtos/newsletterSubscriptionResponse.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('Newsletter')
@Controller()
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @ApiOperation({
    summary: 'Subscribe to newsletter',
    description:
      'Creates a new newsletter subscription with the provided email',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully subscribed to newsletter',
    type: NewsletterSubscriptionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email already subscribed or invalid email format',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @HttpCode(201)
  @Post()
  async createSubscription(
    @Body() body: CreateNewsletterSubscriptionDto,
  ): Promise<NewsletterSubscriptionResponseDto> {
    await this.newsletterService.isCreateNewsletterSubscriptionDtoValid(body);
    return this.newsletterService.createSubscription(body);
  }
}
