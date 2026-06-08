import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IVenueAmenity } from '@boxplay/shared';
import { Venue } from './venue.entity';

@Entity('venue_amenities')
export class VenueAmenity implements IVenueAmenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'venue_id' })
  venueId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, name: 'icon_key', nullable: true })
  iconKey: string | null;

  @ManyToOne(() => Venue, (venue) => venue.amenities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;
}
