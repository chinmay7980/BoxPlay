import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { IBooking, BookingStatus } from '@boxplay/shared';
import { User } from './user.entity';
import { Venue } from './venue.entity';
import { Court } from './court.entity';
import { Slot } from './slot.entity';
import { Coupon } from './coupon.entity';
import { Transaction } from './transaction.entity';
import { Review } from './review.entity';

@Entity('bookings')
@Index('idx_bookings_player', ['playerId', 'createdAt'])
@Index('idx_bookings_venue', ['venueId', 'date', 'status'])
export class Booking implements IBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'pass_id' })
  passId: string;

  @Column({ type: 'uuid', name: 'player_id' })
  playerId: string;

  @Column({ type: 'uuid', name: 'venue_id' })
  venueId: string;

  @Column({ type: 'uuid', name: 'court_id' })
  courtId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'smallint', name: 'slot_count' })
  slotCount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'discount_amount',
    default: 0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'wallet_credit_used',
    default: 0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  walletCreditUsed: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'total_amount',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  totalAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'platform_commission',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  platformCommission: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'owner_payout',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  ownerPayout: number;

  @Column({ type: 'uuid', name: 'coupon_id', nullable: true })
  couponId: string | null;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player: User;

  @ManyToOne(() => Venue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @ManyToOne(() => Court, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @ManyToOne(() => Coupon, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon | null;

  @ManyToMany(() => Slot, (slot) => slot.bookings)
  @JoinTable({
    name: 'booking_slots',
    joinColumn: { name: 'booking_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'slot_id', referencedColumnName: 'id' },
  })
  slots: Slot[];

  @OneToOne(() => Transaction, (transaction) => transaction.booking)
  transaction: Transaction;

  @OneToOne(() => Review, (review) => review.booking)
  review: Review;
}
