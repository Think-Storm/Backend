import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Patch,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { User } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { SetNotificationReadDto } from './dtos/setNotificationRead.dto';

@ApiTags('notifications')
@Controller()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all notifications for the user',
  })
  async getAllNotifications(@GetUser() user: User) {
    return await this.notificationService.getUserNotifications(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(@Param('id', ParseIntPipe) id: number) {
    return await this.notificationService.deleteNotification(id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete all notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications deleted successfully',
  })
  async deleteAllNotifications(@GetUser() user: User) {
    return await this.notificationService.clearAllNotifications(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Set notification read status' })
  @ApiResponse({
    status: 200,
    description: 'Notification read status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  async setNotificationRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetNotificationReadDto,
  ) {
    return await this.notificationService.setNotificationRead(id, dto.isRead);
  }
}
