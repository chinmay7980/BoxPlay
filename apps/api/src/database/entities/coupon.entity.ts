import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ICoupon, CouponType } from '@boxplay/shared';

@Entity('coupons')
export class Coupon implements ICoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: CouponType,
  })
  type: CouponType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  value: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'max_discount',
    nullable: true,
    transformer: {
      to: (val: number | null) => val,
      from: (val: string | null) => (val ? parseFloat(val) : null),
    },
  })
  maxDiscount: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'min_order_value',
    default: 0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  minOrderValue: number;

  @Column({ type: 'integer', name: 'max_uses_total', nullable: true })
  maxUsesTotal: number | null;

  @Column({ type: 'integer', name: 'max_uses_per_user', default: 1 })
  maxUsesPerUser: number;

  @Column({ type: 'integer', name: 'times_used', default: 0 })
  timesUsed: number;

  @Column({ type: 'timestamptz', name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'timestamptz', name: 'valid_until' })
  validUntil: Date;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
