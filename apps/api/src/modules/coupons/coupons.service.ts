import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../../database/entities/coupon.entity';
import {
  CouponType,
  CouponValidationResultDto,
  ValidateCouponDto,
} from '@boxplay/shared';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  /**
   * Find coupon record by code string.
   */
  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({
      where: { code: code.toUpperCase().trim() },
    });
  }

  /**
   * Validate and compute coupon discount. Returns standard response structure.
   */
  async validate(dto: ValidateCouponDto): Promise<CouponValidationResultDto> {
    const coupon = await this.findByCode(dto.code);
    if (!coupon || !coupon.isActive) {
      return {
        valid: false,
        code: dto.code,
        type: CouponType.FLAT,
        discount: 0,
        newTotal: dto.totalAmount,
        message: 'Invalid coupon code',
      };
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return {
        valid: false,
        code: coupon.code,
        type: coupon.type,
        discount: 0,
        newTotal: dto.totalAmount,
        message: 'Coupon is not active yet',
      };
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return {
        valid: false,
        code: coupon.code,
        type: coupon.type,
        discount: 0,
        newTotal: dto.totalAmount,
        message: 'Coupon has expired',
      };
    }

    if (coupon.minOrderValue && dto.totalAmount < coupon.minOrderValue) {
      return {
        valid: false,
        code: coupon.code,
        type: coupon.type,
        discount: 0,
        newTotal: dto.totalAmount,
        message: `Minimum order value of ₹${coupon.minOrderValue} required`,
      };
    }

    if (
      coupon.maxUsesTotal !== null &&
      coupon.timesUsed >= coupon.maxUsesTotal
    ) {
      return {
        valid: false,
        code: coupon.code,
        type: coupon.type,
        discount: 0,
        newTotal: dto.totalAmount,
        message: 'Coupon usage limit reached',
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === CouponType.FLAT) {
      discount = coupon.value;
    } else if (coupon.type === CouponType.PERCENT) {
      discount = (coupon.value / 100) * dto.totalAmount;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    // Discount cannot exceed order total
    if (discount > dto.totalAmount) {
      discount = dto.totalAmount;
    }

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount: parseFloat(discount.toFixed(2)),
      newTotal: parseFloat((dto.totalAmount - discount).toFixed(2)),
    };
  }

  /**
   * Increment coupon uses counter.
   */
  async incrementUses(couponId: string): Promise<void> {
    await this.couponRepository.increment({ id: couponId }, 'timesUsed', 1);
  }
}
