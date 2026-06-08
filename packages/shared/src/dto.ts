// ============================================================================
// BoxPlay — Shared DTO Types
// Data Transfer Objects for API request/response contracts.
// ============================================================================

import {
  UserRole,
  VenueStatus,
  BookingStatus,
  SlotStatus,
  CouponType,
} from './enums';

// ─── Auth DTOs ───────────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole.PLAYER | UserRole.OWNER;
}

export interface LoginDto {
  loginId: string; // email or phone
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDto;
}

export interface UserProfileDto {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  walletBalance: number;
}

// ─── Venue DTOs ──────────────────────────────────────────────────────────────

export interface VenueListItemDto {
  id: string;
  name: string;
  slug: string;
  addressLine: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  ratingAvg: number;
  reviewsCount: number;
  status: VenueStatus;
  primaryPhotoUrl: string | null;
  sports: string[];
  amenities: string[];
  minPricePerHour: number;
}

export interface VenueDetailDto extends VenueListItemDto {
  ownerId: string;
  description: string | null;
  mapsLink: string | null;
  openTime: string;
  closeTime: string;
  photos: { url: string; sortOrder: number; isPrimary: boolean }[];
  courts: CourtDto[];
}

export interface CourtDto {
  id: string;
  name: string;
  sportName: string;
  sportSlug: string;
  basePricePerHour: number;
  maxPlayers: number | null;
  surfaceType: string | null;
  isIndoor: boolean;
  isActive: boolean;
}

export interface CreateVenueDto {
  name: string;
  description?: string;
  addressLine: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  mapsLink?: string;
  openTime?: string; // HH:MM:SS
  closeTime?: string; // HH:MM:SS
  sportIds?: number[];
  amenities?: { name: string; iconKey?: string }[];
  photos?: { url: string; sortOrder?: number; isPrimary?: boolean }[];
}

export interface UpdateVenueDto extends Partial<CreateVenueDto> {}

export interface CreateCourtDto {
  sportId: number;
  name: string;
  description?: string;
  basePricePerHour: number;
  maxPlayers?: number;
  surfaceType?: string;
  isIndoor?: boolean;
  isActive?: boolean;
}

export interface UpdateCourtDto extends Partial<CreateCourtDto> {}

// ─── Slot & Availability DTOs ────────────────────────────────────────────────

export interface SlotDto {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  status: SlotStatus;
}

export interface AvailabilityRequestDto {
  courtId: string;
  date: string; // YYYY-MM-DD
}

export interface AvailabilityResponseDto {
  courtId: string;
  date: string;
  slots: SlotDto[];
}

// ─── Booking DTOs ────────────────────────────────────────────────────────────

export interface CreateBookingDto {
  courtId: string;
  date: string;
  slotIds: string[];
  couponCode?: string;
  walletCreditAmount?: number;
}

export interface BookingResponseDto {
  id: string;
  passId: string;
  venueName: string;
  venueAddress: string;
  courtName: string;
  sportName: string;
  date: string;
  slots: { startTime: string; endTime: string; price: number }[];
  subtotal: number;
  discountAmount: number;
  walletCreditUsed: number;
  totalAmount: number;
  platformCommission: number;
  ownerPayout: number;
  status: BookingStatus;
  createdAt: Date;
}

// ─── Analytics DTOs (Owner Dashboard / Super Admin) ──────────────────────────

export interface OwnerAnalyticsDto {
  totalRevenue: number;
  totalBookings: number;
  occupancyRatePercent: number;
  peakBookingHours: { hour: number; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topCourts: { courtName: string; bookings: number; revenue: number }[];
}

export interface AdminPlatformMetricsDto {
  totalTransactionVolume: number;
  totalCommissionsEarned: number;
  totalUsers: number;
  totalVenues: number;
  userGrowthByMonth: { month: string; count: number }[];
  venueGrowthByMonth: { month: string; count: number }[];
  pendingApprovals: number;
}

// ─── Coupon DTOs ─────────────────────────────────────────────────────────────

export interface ValidateCouponDto {
  code: string;
  totalAmount: number;
}

export interface CouponValidationResultDto {
  valid: boolean;
  code: string;
  type: CouponType;
  discount: number;
  newTotal: number;
  message?: string;
}

// ─── Wallet DTOs ─────────────────────────────────────────────────────────────

export interface WalletBalanceDto {
  balance: number;
  transactions: WalletTransactionDto[];
}

export interface WalletTransactionDto {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  description: string | null;
  createdAt: Date;
}
