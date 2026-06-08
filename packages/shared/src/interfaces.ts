// ============================================================================
// BoxPlay — Core Domain Interfaces
// OOP-first interface definitions for all domain entities.
// These interfaces define the SHAPE of data flowing through the system.
// ============================================================================

import {
  UserRole,
  OnboardingStatus,
  VenueStatus,
  SlotStatus,
  BookingStatus,
  TransactionStatus,
  PaymentGateway,
  PayoutStatus,
  WalletTransactionType,
  WalletTransactionReason,
  CouponType,
} from './enums';

// ─── Base Entity ─────────────────────────────────────────────────────────────

/** Every persisted entity has these timestamp fields. */
export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Entities that support soft-delete. */
export interface ISoftDeletable {
  deletedAt: Date | null;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface IUser extends IBaseEntity, ISoftDeletable {
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  /** Only for owners — Razorpay/Stripe connected account ID. */
  stripeAccountId: string | null;
  /** Only for owners — admin approval status. */
  onboardingStatus: OnboardingStatus;
  refreshTokenHash: string | null;
}

// ─── Sports ──────────────────────────────────────────────────────────────────

export interface ISport {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
  isActive: boolean;
}

// ─── Venues ──────────────────────────────────────────────────────────────────

export interface IVenue extends IBaseEntity, ISoftDeletable {
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  addressLine: string;
  city: string;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsLink: string | null;
  ratingAvg: number;
  reviewsCount: number;
  status: VenueStatus;
  /** Platform commission percentage for this venue (5–10%). */
  commissionRate: number;
  openTime: string;
  closeTime: string;
}

export interface IVenuePhoto {
  id: string;
  venueId: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface IVenueAmenity {
  id: string;
  venueId: string;
  name: string;
  iconKey: string | null;
}

// ─── Courts ──────────────────────────────────────────────────────────────────

export interface ICourt extends IBaseEntity {
  venueId: string;
  sportId: number;
  name: string;
  description: string | null;
  basePricePerHour: number;
  maxPlayers: number | null;
  surfaceType: string | null;
  isIndoor: boolean;
  isActive: boolean;
  deletedAt: Date | null;
}

export interface ICourtPricingRule {
  id: string;
  courtId: string;
  label: string;
  /** Days of week (0=Sun, 6=Sat). null = all days. */
  dayOfWeek: number[] | null;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  validFrom: Date | null;
  validUntil: Date | null;
  priority: number;
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export interface ISlot {
  id: string;
  courtId: string;
  date: string; // ISO date string YYYY-MM-DD
  startTime: string;
  endTime: string;
  /** Resolved price from base or pricing rules. */
  price: number;
  status: SlotStatus;
  /** User holding a temporary checkout lock. */
  lockedBy: string | null;
  /** Lock expiry timestamp. */
  lockUntil: Date | null;
  blockedReason: string | null;
  createdAt: Date;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export interface IBooking extends IBaseEntity {
  /** Human-readable booking code: BXP-831204 */
  passId: string;
  playerId: string;
  venueId: string;
  courtId: string;
  date: string;
  slotCount: number;
  subtotal: number;
  discountAmount: number;
  walletCreditUsed: number;
  totalAmount: number;
  platformCommission: number;
  ownerPayout: number;
  couponId: string | null;
  status: BookingStatus;
  cancellationReason: string | null;
  cancelledAt: Date | null;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export interface ITransaction extends IBaseEntity {
  bookingId: string;
  playerId: string;
  ownerId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  gatewaySignature: string | null;
  grossAmount: number;
  walletCreditApplied: number;
  gatewayAmount: number;
  gatewayFee: number;
  platformCommission: number;
  ownerPayoutAmount: number;
  payoutStatus: PayoutStatus;
  payoutReference: string | null;
  status: TransactionStatus;
  refundAmount: number | null;
  refundReference: string | null;
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export interface IWallet {
  id: string;
  userId: string;
  createdAt: Date;
}

export interface IWalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  reason: WalletTransactionReason;
  referenceId: string | null;
  description: string | null;
  createdAt: Date;
}

// ─── Coupons ─────────────────────────────────────────────────────────────────

export interface ICoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrderValue: number;
  maxUsesTotal: number | null;
  maxUsesPerUser: number;
  timesUsed: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface IReview {
  id: string;
  bookingId: string;
  playerId: string;
  venueId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}
