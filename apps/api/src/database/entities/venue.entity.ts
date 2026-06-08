import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { IVenue, VenueStatus } from '@boxplay/shared';
import { User } from './user.entity';
import { VenuePhoto } from './venue-photo.entity';
import { VenueAmenity } from './venue-amenity.entity';
import { Court } from './court.entity';
import { Sport } from './sport.entity';
import { Review } from './review.entity';

@Entity('venues')
export class Venue implements IVenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, name: 'address_line' })
  addressLine: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    transformer: {
      to: (val: number | null) => val,
      from: (val: string | null) => (val ? parseFloat(val) : null),
    },
  })
  latitude: number | null;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    transformer: {
      to: (val: number | null) => val,
      from: (val: string | null) => (val ? parseFloat(val) : null),
    },
  })
  longitude: number | null;

  @Column({ type: 'text', name: 'maps_link', nullable: true })
  mapsLink: string | null;

  @Column({
    type: 'decimal',
    precision: 2,
    scale: 1,
    name: 'rating_avg',
    default: 0.0,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  ratingAvg: number;

  @Column({ type: 'integer', name: 'reviews_count', default: 0 })
  reviewsCount: number;

  @Column({
    type: 'enum',
    enum: VenueStatus,
    default: VenueStatus.DRAFT,
  })
  status: VenueStatus;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    name: 'commission_rate',
    default: 7.5,
    transformer: {
      to: (val: number) => val,
      from: (val: string) => parseFloat(val),
    },
  })
  commissionRate: number;

  @Column({ type: 'time', name: 'open_time', default: '06:00:00' })
  openTime: string;

  @Column({ type: 'time', name: 'close_time', default: '00:00:00' })
  closeTime: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  // Relationships
  @ManyToOne(() => User, (user) => user.venues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => VenuePhoto, (photo) => photo.venue)
  photos: VenuePhoto[];

  @OneToMany(() => VenueAmenity, (amenity) => amenity.venue)
  amenities: VenueAmenity[];

  @OneToMany(() => Court, (court) => court.venue)
  courts: Court[];

  @OneToMany(() => Review, (review) => review.venue)
  reviews: Review[];

  @ManyToMany(() => Sport)
  @JoinTable({
    name: 'venue_sports',
    joinColumn: { name: 'venue_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sport_id', referencedColumnName: 'id' },
  })
  sports: Sport[];
}
