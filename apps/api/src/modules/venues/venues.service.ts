import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Venue } from '../../database/entities/venue.entity';
import { VenuePhoto } from '../../database/entities/venue-photo.entity';
import { VenueAmenity } from '../../database/entities/venue-amenity.entity';
import { Sport } from '../../database/entities/sport.entity';
import {
  CreateVenueDto,
  UpdateVenueDto,
  VenueListItemDto,
  VenueDetailDto,
  VenueStatus,
} from '@boxplay/shared';

@Injectable()
export class VenuesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Sport)
    private readonly sportRepository: Repository<Sport>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(ownerId: string, dto: CreateVenueDto): Promise<Venue> {
    const slug = this.generateSlug(dto.name);
    const existing = await this.venueRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(
        `A venue with name "${dto.name}" already exists`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const venueRepo = manager.getRepository(Venue);
      const photoRepo = manager.getRepository(VenuePhoto);
      const amenityRepo = manager.getRepository(VenueAmenity);
      const sportRepo = manager.getRepository(Sport);

      // 1. Resolve sports
      let sports: Sport[] = [];
      if (dto.sportIds && dto.sportIds.length > 0) {
        sports = await sportRepo.find({ where: { id: In(dto.sportIds) } });
      }

      // 2. Create venue
      const venue = venueRepo.create({
        ownerId,
        name: dto.name,
        slug,
        description: dto.description || null,
        addressLine: dto.addressLine,
        city: dto.city,
        state: dto.state || null,
        pincode: dto.pincode || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        mapsLink: dto.mapsLink || null,
        status: VenueStatus.DRAFT,
        openTime: dto.openTime || '06:00:00',
        closeTime: dto.closeTime || '00:00:00',
        sports,
      });

      const savedVenue = await venueRepo.save(venue);

      // 3. Create photos
      if (dto.photos && dto.photos.length > 0) {
        const photos = dto.photos.map((p, idx) =>
          photoRepo.create({
            venueId: savedVenue.id,
            url: p.url,
            sortOrder: p.sortOrder ?? idx,
            isPrimary: p.isPrimary ?? idx === 0,
          }),
        );
        await photoRepo.save(photos);
      }

      // 4. Create amenities
      if (dto.amenities && dto.amenities.length > 0) {
        const amenities = dto.amenities.map((a) =>
          amenityRepo.create({
            venueId: savedVenue.id,
            name: a.name,
            iconKey: a.iconKey || null,
          }),
        );
        await amenityRepo.save(amenities);
      }

      return venueRepo.findOne({
        where: { id: savedVenue.id },
        relations: ['photos', 'amenities', 'sports'],
      }) as Promise<Venue>;
    });
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateVenueDto,
  ): Promise<Venue> {
    const venue = await this.venueRepository.findOne({
      where: { id },
      relations: ['photos', 'amenities', 'sports'],
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to update this venue',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const venueRepo = manager.getRepository(Venue);
      const photoRepo = manager.getRepository(VenuePhoto);
      const amenityRepo = manager.getRepository(VenueAmenity);
      const sportRepo = manager.getRepository(Sport);

      // Handle properties
      if (dto.name && dto.name !== venue.name) {
        const slug = this.generateSlug(dto.name);
        const existing = await venueRepo.findOne({ where: { slug } });
        if (existing && existing.id !== venue.id) {
          throw new ConflictException(
            `A venue with name "${dto.name}" already exists`,
          );
        }
        venue.name = dto.name;
        venue.slug = slug;
      }

      if (dto.description !== undefined) venue.description = dto.description;
      if (dto.addressLine !== undefined) venue.addressLine = dto.addressLine;
      if (dto.city !== undefined) venue.city = dto.city;
      if (dto.state !== undefined) venue.state = dto.state;
      if (dto.pincode !== undefined) venue.pincode = dto.pincode;
      if (dto.latitude !== undefined) venue.latitude = dto.latitude;
      if (dto.longitude !== undefined) venue.longitude = dto.longitude;
      if (dto.mapsLink !== undefined) venue.mapsLink = dto.mapsLink;
      if (dto.openTime !== undefined) venue.openTime = dto.openTime;
      if (dto.closeTime !== undefined) venue.closeTime = dto.closeTime;

      // Update sports
      if (dto.sportIds) {
        if (dto.sportIds.length > 0) {
          venue.sports = await sportRepo.find({
            where: { id: In(dto.sportIds) },
          });
        } else {
          venue.sports = [];
        }
      }

      await venueRepo.save(venue);

      // Update photos if provided (overwrite existing for simplicity)
      if (dto.photos) {
        await photoRepo.delete({ venueId: venue.id });
        if (dto.photos.length > 0) {
          const photos = dto.photos.map((p, idx) =>
            photoRepo.create({
              venueId: venue.id,
              url: p.url,
              sortOrder: p.sortOrder ?? idx,
              isPrimary: p.isPrimary ?? idx === 0,
            }),
          );
          await photoRepo.save(photos);
        }
      }

      // Update amenities if provided (overwrite existing)
      if (dto.amenities) {
        await amenityRepo.delete({ venueId: venue.id });
        if (dto.amenities.length > 0) {
          const amenities = dto.amenities.map((a) =>
            amenityRepo.create({
              venueId: venue.id,
              name: a.name,
              iconKey: a.iconKey || null,
            }),
          );
          await amenityRepo.save(amenities);
        }
      }

      return venueRepo.findOne({
        where: { id: venue.id },
        relations: ['photos', 'amenities', 'sports'],
      }) as Promise<Venue>;
    });
  }

  async findAllActive(city?: string): Promise<VenueListItemDto[]> {
    const query = this.venueRepository
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.photos', 'photo')
      .leftJoinAndSelect('venue.sports', 'sport')
      .leftJoinAndSelect('venue.amenities', 'amenity')
      .leftJoinAndSelect('venue.courts', 'court')
      .where('venue.status = :status', { status: VenueStatus.ACTIVE });

    if (city) {
      query.andWhere('LOWER(venue.city) = :city', {
        city: city.toLowerCase().trim(),
      });
    }

    const venues = await query.getMany();

    return venues.map((venue) => {
      const primaryPhoto =
        venue.photos.find((p) => p.isPrimary) || venue.photos[0];
      const courtPrices = venue.courts.map((c) => c.basePricePerHour);
      const minPrice = courtPrices.length > 0 ? Math.min(...courtPrices) : 0;

      return {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        addressLine: venue.addressLine,
        city: venue.city,
        latitude: venue.latitude,
        longitude: venue.longitude,
        ratingAvg: venue.ratingAvg,
        reviewsCount: venue.reviewsCount,
        status: venue.status,
        primaryPhotoUrl: primaryPhoto ? primaryPhoto.url : null,
        sports: venue.sports.map((s) => s.name),
        amenities: venue.amenities.map((a) => a.name),
        minPricePerHour: minPrice,
      };
    });
  }

  async findAllByOwner(ownerId: string): Promise<VenueDetailDto[]> {
    const venues = await this.venueRepository.find({
      where: { ownerId },
      relations: ['photos', 'amenities', 'sports', 'courts', 'courts.sport'],
    });

    return venues.map((venue) => {
      const primaryPhoto =
        venue.photos.find((p) => p.isPrimary) || venue.photos[0];
      const courtPrices = venue.courts.map((c) => c.basePricePerHour);
      const minPrice = courtPrices.length > 0 ? Math.min(...courtPrices) : 0;

      return {
        id: venue.id,
        ownerId: venue.ownerId,
        name: venue.name,
        slug: venue.slug,
        description: venue.description,
        addressLine: venue.addressLine,
        city: venue.city,
        latitude: venue.latitude,
        longitude: venue.longitude,
        mapsLink: venue.mapsLink,
        ratingAvg: venue.ratingAvg,
        reviewsCount: venue.reviewsCount,
        status: venue.status,
        primaryPhotoUrl: primaryPhoto ? primaryPhoto.url : null,
        sports: venue.sports.map((s) => s.name),
        amenities: venue.amenities.map((a) => a.name),
        minPricePerHour: minPrice,
        openTime: venue.openTime,
        closeTime: venue.closeTime,
        photos: venue.photos.map((p) => ({
          url: p.url,
          sortOrder: p.sortOrder,
          isPrimary: p.isPrimary,
        })),
        courts: venue.courts.map((c) => ({
          id: c.id,
          name: c.name,
          sportName: c.sport.name,
          sportSlug: c.sport.slug,
          basePricePerHour: c.basePricePerHour,
          maxPlayers: c.maxPlayers,
          surfaceType: c.surfaceType,
          isIndoor: c.isIndoor,
          isActive: c.isActive,
        })),
      };
    });
  }

  async findBySlug(slug: string): Promise<VenueDetailDto> {
    const venue = await this.venueRepository.findOne({
      where: { slug },
      relations: ['photos', 'amenities', 'sports', 'courts', 'courts.sport'],
    });

    if (!venue) {
      throw new NotFoundException(`Venue with slug "${slug}" not found`);
    }

    const primaryPhoto =
      venue.photos.find((p) => p.isPrimary) || venue.photos[0];
    const courtPrices = venue.courts.map((c) => c.basePricePerHour);
    const minPrice = courtPrices.length > 0 ? Math.min(...courtPrices) : 0;

    return {
      id: venue.id,
      ownerId: venue.ownerId,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      addressLine: venue.addressLine,
      city: venue.city,
      latitude: venue.latitude,
      longitude: venue.longitude,
      mapsLink: venue.mapsLink,
      ratingAvg: venue.ratingAvg,
      reviewsCount: venue.reviewsCount,
      status: venue.status,
      primaryPhotoUrl: primaryPhoto ? primaryPhoto.url : null,
      sports: venue.sports.map((s) => s.name),
      amenities: venue.amenities.map((a) => a.name),
      minPricePerHour: minPrice,
      openTime: venue.openTime,
      closeTime: venue.closeTime,
      photos: venue.photos.map((p) => ({
        url: p.url,
        sortOrder: p.sortOrder,
        isPrimary: p.isPrimary,
      })),
      courts: venue.courts.map((c) => ({
        id: c.id,
        name: c.name,
        sportName: c.sport.name,
        sportSlug: c.sport.slug,
        basePricePerHour: c.basePricePerHour,
        maxPlayers: c.maxPlayers,
        surfaceType: c.surfaceType,
        isIndoor: c.isIndoor,
        isActive: c.isActive,
      })),
    };
  }

  async findRawById(id: string): Promise<Venue | null> {
    return this.venueRepository.findOne({ where: { id } });
  }

  async softDelete(ownerId: string, id: string): Promise<void> {
    const venue = await this.venueRepository.findOne({ where: { id } });
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to delete this venue',
      );
    }

    await this.venueRepository.softRemove(venue);
  }

  async approve(id: string): Promise<Venue> {
    const venue = await this.venueRepository.findOne({ where: { id } });
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }
    venue.status = VenueStatus.ACTIVE;
    return this.venueRepository.save(venue);
  }

  async reject(id: string): Promise<Venue> {
    const venue = await this.venueRepository.findOne({ where: { id } });
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }
    venue.status = VenueStatus.SUSPENDED;
    return this.venueRepository.save(venue);
  }
}
