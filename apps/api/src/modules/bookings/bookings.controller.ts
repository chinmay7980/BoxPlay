import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { type CreateBookingDto } from '@boxplay/shared';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.findMyBookings(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getDetails(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.findBookingDetails(user.id, id);
  }
}
