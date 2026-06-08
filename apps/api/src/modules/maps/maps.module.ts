import { Module } from '@nestjs/common';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';
import { VenuesModule } from '../venues/venues.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [VenuesModule, UsersModule],
  providers: [MapsService],
  controllers: [MapsController],
  exports: [MapsService],
})
export class MapsModule {}
