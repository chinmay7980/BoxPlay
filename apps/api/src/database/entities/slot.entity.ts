import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ISlot, SlotStatus } from '@boxplay/shared';
import { Court } from './court.entity';
import { User } from './user.entity';
import { Booking } from './booking.entity';

@Entity('slots')
@Unique(['courtId', 'date', 'startTime'])
@Index('idx_slots_court_date_status', ['courtId', 'date', 'status'])
export class Slot implements ISlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'court_id' })
  courtId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  price: number;

  @Column({
    type: 'enum',
    enum: SlotStatus,
    default: SlotStatus.AVAILABLE,
  })
  status: SlotStatus;

  @Column({ type: 'uuid', name: 'locked_by', nullable: true })
  lockedBy: string | null;

  @Column({ type: 'timestamptz', name: 'lock_until', nullable: true })
  lockUntil: Date | null;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'blocked_reason',
    nullable: true,
  })
  blockedReason: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Court, (court) => court.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'locked_by' })
  lockedByUser: User | null;

  @ManyToMany(() => Booking, (booking) => booking.slots)
  bookings: Booking[];
}
