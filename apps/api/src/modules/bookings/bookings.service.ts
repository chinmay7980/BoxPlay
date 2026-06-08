import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import { Booking } from '../../database/entities/booking.entity';
import { Slot } from '../../database/entities/slot.entity';
import { Court } from '../../database/entities/court.entity';
import { Venue } from '../../database/entities/venue.entity';
import { Wallet } from '../../database/entities/wallet.entity';
import { WalletTransaction } from '../../database/entities/wallet-transaction.entity';
import { Coupon } from '../../database/entities/coupon.entity';
import { CouponsService } from '../coupons/coupons.service';
import { WalletService } from '../wallet/wallet.service';
import {
  CreateBookingDto,
  BookingResponseDto,
  BookingStatus,
  SlotStatus,
  WalletTransactionType,
  WalletTransactionReason,
} from '@boxplay/shared';

@Injectable()
export class BookingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly couponsService: CouponsService,
    private readonly walletService: WalletService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
  ) {}

  /**
   * Helper to generate a unique 6-digit numeric pass ID.
   */
  private async generateUniquePassId(manager: EntityManager): Promise<string> {
    const bookingRepo = manager.getRepository(Booking);
    let passId = '';
    let exists = true;

    while (exists) {
      passId = `BP-${Math.floor(100000 + Math.random() * 900000)}`;
      const found = await bookingRepo.findOne({ where: { passId } });
      if (!found) {
        exists = false;
      }
    }
    return passId;
  }

  /**
   * Create a booking and process checkout inside a TypeORM transaction.
   */
  async createBooking(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(Booking);
      const slotRepo = manager.getRepository(Slot);
      const courtRepo = manager.getRepository(Court);
      const venueRepo = manager.getRepository(Venue);
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const couponRepo = manager.getRepository(Coupon);

      // 1. Fetch court & venue
      const court = await courtRepo.findOne({ where: { id: dto.courtId } });
      if (!court) {
        throw new NotFoundException(`Court with ID ${dto.courtId} not found`);
      }
      const venue = await venueRepo.findOne({ where: { id: court.venueId } });
      if (!venue) {
        throw new NotFoundException(
          `Venue for court ID ${dto.courtId} not found`,
        );
      }

      // 2. Fetch slots and validate availability / locking ownership
      const slots = await slotRepo.find({
        where: { id: In(dto.slotIds) },
      });

      if (slots.length !== dto.slotIds.length) {
        throw new BadRequestException(
          'One or more requested slots are invalid',
        );
      }

      for (const slot of slots) {
        // Dynamic lock expiration check
        const isLockedBySelf =
          slot.status === SlotStatus.LOCKED &&
          slot.lockedBy === userId &&
          slot.lockUntil &&
          slot.lockUntil > new Date();

        if (slot.status !== SlotStatus.AVAILABLE && !isLockedBySelf) {
          throw new ConflictException(
            `Slot starting at ${slot.startTime} is already ${slot.status.toLowerCase()}`,
          );
        }
      }

      // 3. Financial calculations
      const subtotal = slots.reduce((sum, slot) => sum + slot.price, 0);
      let discountAmount = 0;
      let coupon: Coupon | null = null;

      // Apply coupon if provided
      if (dto.couponCode) {
        const valResult = await this.couponsService.validate({
          code: dto.couponCode,
          totalAmount: subtotal,
        });

        if (!valResult.valid) {
          throw new BadRequestException(
            valResult.message || 'Invalid coupon code',
          );
        }

        discountAmount = valResult.discount;
        coupon = await this.couponsService.findByCode(dto.couponCode);
        if (coupon) {
          await couponRepo.increment({ id: coupon.id }, 'timesUsed', 1);
        }
      }

      // Apply wallet credits if requested
      let walletCreditUsed = 0;
      if (dto.walletCreditAmount && dto.walletCreditAmount > 0) {
        const wallet = await walletRepo.findOne({ where: { userId } });
        if (!wallet) {
          throw new NotFoundException('Wallet for current user not found');
        }

        const balance = await this.walletService.getBalanceByWalletId(
          wallet.id,
          manager,
        );
        if (balance < dto.walletCreditAmount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        // Cap wallet credit to the remaining checkout total
        const remainingTotal = subtotal - discountAmount;
        walletCreditUsed = Math.min(dto.walletCreditAmount, remainingTotal);

        if (walletCreditUsed > 0) {
          // Log wallet transaction debit
          const debitTx = walletTxRepo.create({
            walletId: wallet.id,
            type: WalletTransactionType.DEBIT,
            amount: walletCreditUsed,
            reason: WalletTransactionReason.BOOKING_REDEMPTION,
            description: `Applied ₹${walletCreditUsed.toFixed(2)} at booking checkout`,
          });
          await walletTxRepo.save(debitTx);
        }
      }

      const totalAmount = parseFloat(
        (subtotal - discountAmount - walletCreditUsed).toFixed(2),
      );
      const platformCommission = parseFloat(
        ((venue.commissionRate / 100) * subtotal).toFixed(2),
      );
      const ownerPayout = parseFloat(
        (totalAmount - platformCommission).toFixed(2),
      );

      // 4. Generate unique passId
      const passId = await this.generateUniquePassId(manager);

      // 5. Update slot statuses to BOOKED
      for (const slot of slots) {
        slot.status = SlotStatus.BOOKED;
        slot.lockedBy = null;
        slot.lockUntil = null;
        await slotRepo.save(slot);
      }

      // 6. Create booking entry
      const booking = bookingRepo.create({
        passId,
        playerId: userId,
        venueId: venue.id,
        courtId: court.id,
        date: dto.date,
        slotCount: slots.length,
        subtotal,
        discountAmount,
        walletCreditUsed,
        totalAmount,
        platformCommission,
        ownerPayout,
        couponId: coupon ? coupon.id : null,
        status: BookingStatus.CONFIRMED,
        slots,
      });

      const savedBooking = await bookingRepo.save(booking);

      return {
        id: savedBooking.id,
        passId: savedBooking.passId,
        venueName: venue.name,
        venueAddress: venue.addressLine,
        courtName: court.name,
        sportName: court.name, // Will retrieve from relationship outside txn if needed
        date: savedBooking.date,
        slots: slots.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          price: s.price,
        })),
        subtotal: savedBooking.subtotal,
        discountAmount: savedBooking.discountAmount,
        walletCreditUsed: savedBooking.walletCreditUsed,
        totalAmount: savedBooking.totalAmount,
        platformCommission: savedBooking.platformCommission,
        ownerPayout: savedBooking.ownerPayout,
        status: savedBooking.status,
        createdAt: savedBooking.createdAt,
      };
    });
  }

  /**
   * Find booking details for a player.
   */
  async findBookingDetails(userId: string, id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['slots', 'venue', 'court', 'court.sport'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.playerId !== userId && booking.venue.ownerId !== userId) {
      throw new ConflictException(
        'You are not authorized to view this booking ticket',
      );
    }

    return booking;
  }

  /**
   * List all bookings for a player.
   */
  async findMyBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { playerId: userId },
      relations: ['venue', 'court', 'court.sport', 'slots'],
      order: { createdAt: 'DESC' },
    });
  }
}
