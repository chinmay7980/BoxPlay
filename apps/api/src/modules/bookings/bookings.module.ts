import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../../database/entities/booking.entity';
import { Slot } from '../../database/entities/slot.entity';
import { Court } from '../../database/entities/court.entity';
import { Venue } from '../../database/entities/venue.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { Coupon } from '../../database/entities/coupon.entity';
import { User } from '../../database/entities/user.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CouponsModule } from '../coupons/coupons.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Slot,
      Court,
      Venue,
      Wallet,
      WalletTransaction,
      Coupon,
      User,
    ]),
    CouponsModule,
    WalletModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
