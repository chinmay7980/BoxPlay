// ============================================================================
// BoxPlay — Core Enumerations
// Strict TypeScript enums shared across the entire stack.
// ============================================================================

/** User roles controlling access across all three modules. */
export enum UserRole {
  PLAYER = 'player',
  OWNER = 'owner',
  ADMIN = 'admin',
}

/** Owner onboarding lifecycle managed by Super Admin. */
export enum OnboardingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

/** Venue publishing lifecycle. */
export enum VenueStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

/** Individual time-slot states — the core of double-booking prevention. */
export enum SlotStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
}

/** Booking lifecycle from checkout to post-game. */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  NO_SHOW = 'no_show',
}

/** Payment transaction lifecycle. */
export enum TransactionStatus {
  INITIATED = 'initiated',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** Gateway used for the transaction. */
export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  WALLET_ONLY = 'wallet_only',
}

/** Owner payout settlement status. */
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/** Wallet ledger entry direction. */
export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

/** Reason code for wallet credits/debits. */
export enum WalletTransactionReason {
  SIGNUP_BONUS = 'signup_bonus',
  REFERRAL = 'referral',
  REFUND = 'refund',
  BOOKING_REDEMPTION = 'booking_redemption',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  EXPIRED = 'expired',
  TOPUP = 'topup',
}

/** Coupon discount type. */
export enum CouponType {
  PERCENT = 'percent',
  FLAT = 'flat',
}
