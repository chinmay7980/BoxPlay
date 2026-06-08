import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from '../../database/entities/venue.entity';
import { VenuePhoto } from '../../database/entities/venue-photo.entity';
import { VenueAmenity } from '../../database/entities/venue-amenity.entity';
import { Sport } from '../../database/entities/sport.entity';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Venue, VenuePhoto, VenueAmenity, Sport])],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
