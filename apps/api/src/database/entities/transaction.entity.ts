import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  ITransaction,
  PaymentGateway,
  PayoutStatus,
  TransactionStatus,
} from '@boxplay/shared';
import { Booking } from './booking.entity';
import { User } from './user.entity';

@Entity('transactions')
@Index('idx_transactions_owner', ['ownerId', 'createdAt'])
export class Transaction implements ITransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'booking_id', unique: true })
  bookingId: string;

  @Column({ type: 'uuid', name: 'player_id' })
  playerId: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'gateway_order_id',
    nullable: true,
  })
  gatewayOrderId: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'gateway_payment_id',
    nullable: true,
  })
  gatewayPaymentId: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'gateway_signature',
    nullable: true,
  })
  gatewaySignature: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'gross_amount',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  grossAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'wallet_credit_applied',
    default: 0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  walletCreditApplied: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'gateway_amount',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  gatewayAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'gateway_fee',
    default: 0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  gatewayFee: number;

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
    name: 'owner_payout_amount',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  ownerPayoutAmount: number;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    name: 'payout_status',
    default: PayoutStatus.PENDING,
  })
  payoutStatus: PayoutStatus;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'payout_reference',
    nullable: true,
  })
  payoutReference: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.INITIATED,
  })
  status: TransactionStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'refund_amount',
    nullable: true,
    transformer: {
      to: (val: number | null) => val,
      from: (val: string | null) => (val ? parseFloat(val) : null),
    },
  })
  refundAmount: number | null;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'refund_reference',
    nullable: true,
  })
  refundReference: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToOne(() => Booking, (booking) => booking.transaction, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'player_id' })
  player: User;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
