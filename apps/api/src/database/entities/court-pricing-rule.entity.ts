import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ICourtPricingRule } from '@boxplay/shared';
import { Court } from './court.entity';

@Entity('court_pricing_rules')
export class CourtPricingRule implements ICourtPricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'court_id' })
  courtId: string;

  @Column({ type: 'varchar', length: 80 })
  label: string;

  @Column({
    type: 'smallint',
    array: true,
    name: 'day_of_week',
    nullable: true,
  })
  dayOfWeek: number[] | null;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'price_per_hour',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  pricePerHour: number;

  @Column({
    type: 'date',
    name: 'valid_from',
    nullable: true,
    transformer: {
      to: (val: Date | null) => val,
      from: (val: string | null) => (val ? new Date(val) : null),
    },
  })
  validFrom: Date | null;

  @Column({
    type: 'date',
    name: 'valid_until',
    nullable: true,
    transformer: {
      to: (val: Date | null) => val,
      from: (val: string | null) => (val ? new Date(val) : null),
    },
  })
  validUntil: Date | null;

  @Column({ type: 'smallint', default: 0 })
  priority: number;

  @ManyToOne(() => Court, (court) => court.pricingRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'court_id' })
  court: Court;
}
