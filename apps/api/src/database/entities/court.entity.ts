import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ICourt } from '@boxplay/shared';
import { Venue } from './venue.entity';
import { Sport } from './sport.entity';
import { CourtPricingRule } from './court-pricing-rule.entity';
import { Slot } from './slot.entity';
import { Booking } from './booking.entity';

@Entity('courts')
export class Court implements ICourt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'venue_id' })
  venueId: string;

  @Column({ type: 'integer', name: 'sport_id' })
  sportId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'base_price_per_hour',
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  basePricePerHour: number;

  @Column({ type: 'smallint', name: 'max_players', nullable: true })
  maxPlayers: number | null;

  @Column({ type: 'varchar', length: 60, name: 'surface_type', nullable: true })
  surfaceType: string | null;

  @Column({ type: 'boolean', name: 'is_indoor', default: false })
  isIndoor: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relationships
  @ManyToOne(() => Venue, (venue) => venue.courts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @ManyToOne(() => Sport, (sport) => sport.courts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sport_id' })
  sport: Sport;

  @OneToMany(() => CourtPricingRule, (rule) => rule.court)
  pricingRules: CourtPricingRule[];

  @OneToMany(() => Slot, (slot) => slot.court)
  slots: Slot[];

  @OneToMany(() => Booking, (booking) => booking.court)
  bookings: Booking[];
}
