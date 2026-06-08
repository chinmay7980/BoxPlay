import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@Controller()
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get('courts/:courtId/slots')
  @HttpCode(HttpStatus.OK)
  async getSlots(
    @Param('courtId') courtId: string,
    @Query('date') date: string,
  ) {
    return this.slotsService.findAvailableSlots(courtId, date);
  }

  @Post('slots/:id/lock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async lock(@Param('id') id: string, @CurrentUser() user: User) {
    return this.slotsService.lockSlot(id, user.id);
  }
}
