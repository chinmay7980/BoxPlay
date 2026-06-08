import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { type WalletBalanceDto } from '@boxplay/shared';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(@CurrentUser() user: User) {
    return this.walletService.getWalletDetails(user.id);
  }

  @Post('topup')
  @HttpCode(HttpStatus.OK)
  async topup(
    @CurrentUser() user: User,
    @Body() dto: { amount: number },
  ): Promise<WalletBalanceDto> {
    await this.walletService.topUpWallet(user.id, dto.amount);
    return this.walletService.getWalletDetails(user.id);
  }
}
