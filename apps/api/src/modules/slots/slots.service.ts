import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from '../../database/entities/slot.entity';
import { SlotStatus } from '@boxplay/shared';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: Repository<Slot>,
  ) {}

  /**
   * Helper to reset locks dynamically if they have expired.
   */
  private checkAndResetExpiredLock(slot: Slot): boolean {
    if (
      slot.status === SlotStatus.LOCKED &&
      slot.lockUntil &&
      slot.lockUntil < new Date()
    ) {
      slot.status = SlotStatus.AVAILABLE;
      slot.lockedBy = null;
      slot.lockUntil = null;
      return true;
    }
    return false;
  }

  /**
   * Fetch slots availability for a court on a date. Expired locks are cleaned up.
   */
  async findAvailableSlots(courtId: string, date: string): Promise<Slot[]> {
    const slots = await this.slotRepository.find({
      where: { courtId, date },
      order: { startTime: 'ASC' },
    });

    // Clean up expired locks in memory and save updates to DB
    const updatedSlots: Slot[] = [];
    for (const slot of slots) {
      if (this.checkAndResetExpiredLock(slot)) {
        await this.slotRepository.save(slot);
      }
      updatedSlots.push(slot);
    }

    return updatedSlots;
  }

  /**
   * Acquire a temporary 10-minute lock on a slot.
   */
  async lockSlot(slotId: string, userId: string): Promise<Slot> {
    const slot = await this.slotRepository.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException(`Slot with ID ${slotId} not found`);
    }

    // Dynamic cleanup check
    this.checkAndResetExpiredLock(slot);

    // If slot is not available, check if the current user already holds the lock
    if (slot.status !== SlotStatus.AVAILABLE) {
      if (slot.status === SlotStatus.LOCKED && slot.lockedBy === userId) {
        // Extend lock
        slot.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        return this.slotRepository.save(slot);
      }
      throw new ConflictException(
        `Slot is already ${slot.status.toLowerCase()}`,
      );
    }

    // Set lock
    slot.status = SlotStatus.LOCKED;
    slot.lockedBy = userId;
    slot.lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    return this.slotRepository.save(slot);
  }
}
