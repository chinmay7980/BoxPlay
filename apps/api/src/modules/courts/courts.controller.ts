import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  type CreateCourtDto,
  type UpdateCourtDto,
  UserRole,
} from '@boxplay/shared';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post('venues/:venueId/courts')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Param('venueId') venueId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courtsService.create(user.id, venueId, dto);
  }

  @Patch('courts/:id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(user.id, id, dto);
  }

  @Delete('courts/:id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    await this.courtsService.softDelete(user.id, id);
  }
}
