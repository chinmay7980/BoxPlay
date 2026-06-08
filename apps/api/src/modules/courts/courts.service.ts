import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Court } from '../../database/entities/court.entity';
import { VenuesService } from '../venues/venues.service';
import { CreateCourtDto, UpdateCourtDto } from '@boxplay/shared';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    private readonly venuesService: VenuesService,
  ) {}

  async create(
    ownerId: string,
    venueId: string,
    dto: CreateCourtDto,
  ): Promise<Court> {
    const venue = await this.venuesService.findRawById(venueId);
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to add courts to this venue',
      );
    }

    const court = this.courtRepository.create({
      venueId,
      sportId: dto.sportId,
      name: dto.name,
      description: dto.description || null,
      basePricePerHour: dto.basePricePerHour,
      maxPlayers: dto.maxPlayers || null,
      surfaceType: dto.surfaceType || null,
      isIndoor: dto.isIndoor ?? false,
      isActive: dto.isActive ?? true,
    });

    return this.courtRepository.save(court);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateCourtDto,
  ): Promise<Court> {
    const court = await this.courtRepository.findOne({ where: { id } });
    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    const venue = await this.venuesService.findRawById(court.venueId);
    if (!venue || venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to update this court',
      );
    }

    if (dto.name !== undefined) court.name = dto.name;
    if (dto.description !== undefined) court.description = dto.description;
    if (dto.basePricePerHour !== undefined)
      court.basePricePerHour = dto.basePricePerHour;
    if (dto.maxPlayers !== undefined) court.maxPlayers = dto.maxPlayers;
    if (dto.surfaceType !== undefined) court.surfaceType = dto.surfaceType;
    if (dto.isIndoor !== undefined) court.isIndoor = dto.isIndoor;
    if (dto.isActive !== undefined) court.isActive = dto.isActive;
    if (dto.sportId !== undefined) court.sportId = dto.sportId;

    return this.courtRepository.save(court);
  }

  async softDelete(ownerId: string, id: string): Promise<void> {
    const court = await this.courtRepository.findOne({ where: { id } });
    if (!court) {
      throw new NotFoundException(`Court with ID ${id} not found`);
    }

    const venue = await this.venuesService.findRawById(court.venueId);
    if (!venue || venue.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You are not authorized to delete this court',
      );
    }

    await this.courtRepository.softRemove(court);
  }
}
