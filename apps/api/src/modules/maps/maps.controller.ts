import { Controller, Post, Body, Inject, Logger } from '@nestjs/common';
import { MapsService } from './maps.service';
import { VenuesService } from '../venues/venues.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '@boxplay/shared';

@Controller('admin/maps')
export class MapsController {
  private readonly logger = new Logger(MapsController.name);

  constructor(
    private readonly mapsService: MapsService,
    private readonly venuesService: VenuesService,
    private readonly usersService: UsersService,
  ) {}

  @Post('import')
  async importVenues(@Body() dto: { city: string; query: string }) {
    this.logger.log(`Importing venues for city: ${dto.city}, query: ${dto.query}`);
    
    // 1. Fetch raw places from Google Maps (or mock)
    const rawPlaces = await this.mapsService.fetchTurfsFromGoogle(dto.city, dto.query);
    
    if (!rawPlaces || rawPlaces.length === 0) {
      return { success: false, message: 'No venues found to import.' };
    }

    // 2. Ensure we have a default admin user to own these imported venues
    let admin = await this.usersService.findByEmail('admin@boxplay.local');
    if (!admin) {
      admin = await this.usersService.create({
        name: 'System Admin',
        email: 'admin@boxplay.local',
        passwordHash: 'dummy_hash', // In a real scenario, use bcrypt and strong password
        role: UserRole.OWNER,
        isActive: true,
        isVerified: true,
      });
    }

    // 3. Map and import each venue
    const importedVenues = [];
    for (const place of rawPlaces) {
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const photos: { url: string; sortOrder: number; isPrimary: boolean }[] = [];
        
        if (place.photos && place.photos.length > 0) {
          if (apiKey && apiKey !== 'your_api_key_here') {
            // Get up to 3 photos
            const topPhotos = place.photos.slice(0, 3);
            topPhotos.forEach((photo: any, index: number) => {
              photos.push({
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`,
                sortOrder: index,
                isPrimary: index === 0,
              });
            });
          } else {
            // Mock photo for mock data
            photos.push({
              url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
              sortOrder: 0,
              isPrimary: true,
            });
          }
        }

        const venueDto: any = {
          name: place.name,
          addressLine: place.formatted_address,
          city: dto.city,
          latitude: place.geometry?.location?.lat,
          longitude: place.geometry?.location?.lng,
          openTime: '06:00:00',
          closeTime: '23:00:00',
          description: `Automatically imported venue from Google Maps. Rating: ${place.rating} (${place.user_ratings_total} reviews)`,
          photos: photos,
        };

        const venue = await this.venuesService.create(admin.id, venueDto);
        
        // Auto-approve the venue for immediate display
        await this.venuesService.approve(venue.id);
        
        importedVenues.push(venue);
      } catch (err: any) {
        // Venue might already exist (ConflictException) due to same name/slug
        this.logger.error(`Skipped ${place.name}: ${err.message}`);
      }
    }

    return { 
      success: true, 
      importedCount: importedVenues.length,
      venues: importedVenues.map(v => v.name)
    };
  }
}
