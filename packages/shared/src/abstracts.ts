// ============================================================================
// BoxPlay — Abstract Base Classes
// OOP foundation: abstract classes that concrete implementations must extend.
// These enforce structure and provide shared behavior.
// ============================================================================

import { PaymentGateway, TransactionStatus } from './enums';

// ─── Abstract Payment Method ─────────────────────────────────────────────────

/**
 * Abstract base class for payment method integrations.
 * Each gateway (Razorpay, Stripe) must implement these methods.
 *
 * @example
 * class RazorpayPaymentMethod extends AbstractPaymentMethod { ... }
 */
export abstract class AbstractPaymentMethod {
  abstract readonly gateway: PaymentGateway;

  /**
   * Create a payment order/intent with the gateway.
   * @returns The gateway's order ID and any client-side tokens needed.
   */
  abstract createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;

  /**
   * Verify a payment after the client-side flow completes.
   * @returns Whether the payment was successfully captured.
   */
  abstract verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;

  /**
   * Issue a refund for a captured payment.
   */
  abstract initiateRefund(params: RefundParams): Promise<RefundResult>;

  /**
   * Transfer funds to a venue owner's connected account (split payment).
   */
  abstract transferToOwner(params: TransferParams): Promise<TransferResult>;

  /**
   * Template method: orchestrates the full checkout flow.
   * Subclasses can override individual steps without changing the overall flow.
   */
  async processCheckout(params: CreateOrderParams): Promise<PaymentOrderResult> {
    this.validateAmount(params.amount);
    return this.createOrder(params);
  }

  /** Shared validation logic. */
  protected validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be a positive number.');
    }
    if (amount > 1_000_000) {
      throw new Error('Payment amount exceeds maximum limit.');
    }
  }
}

// ─── Abstract Ticket Generator ───────────────────────────────────────────────

/**
 * Abstract base for generating digital booking tickets/passes.
 * Different ticket formats (PDF, QR, in-app) can extend this.
 */
export abstract class AbstractTicketGenerator {
  /**
   * Generate a unique pass ID for a booking.
   * Default: BXP-XXXXXX format.
   */
  generatePassId(): string {
    const num = Math.floor(100_000 + Math.random() * 900_000);
    return `BXP-${num}`;
  }

  /**
   * Generate the ticket content/payload.
   */
  abstract generateTicket(params: TicketParams): Promise<TicketResult>;

  /**
   * Validate that a ticket/pass is genuine and still valid.
   */
  abstract validateTicket(passId: string): Promise<TicketValidationResult>;
}

// ─── Abstract Commission Calculator ─────────────────────────────────────────

/**
 * Abstract base for computing platform revenue splits.
 * Allows different commission strategies (flat %, tiered, negotiated).
 */
export abstract class AbstractCommissionCalculator {
  /**
   * Calculate the financial breakdown for a booking.
   */
  abstract calculate(params: CommissionParams): CommissionBreakdown;

  /**
   * Validate that the split adds up correctly (integrity check).
   */
  protected validateBreakdown(breakdown: CommissionBreakdown): void {
    const sum = breakdown.platformCommission + breakdown.ownerPayout + breakdown.gatewayFee;
    const diff = Math.abs(breakdown.gatewayAmount - sum);
    if (diff > 0.01) {
      throw new Error(
        `Commission breakdown integrity check failed: ` +
        `gateway=${breakdown.gatewayAmount}, sum=${sum}, diff=${diff}`
      );
    }
  }
}

// ─── Parameter & Result Types ────────────────────────────────────────────────

export interface CreateOrderParams {
  amount: number;
  currency: string;
  bookingId: string;
  playerEmail: string;
  playerPhone?: string;
  description?: string;
}

export interface PaymentOrderResult {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  /** Client-side key/token needed to render the checkout UI. */
  clientSecret?: string;
  status: TransactionStatus;
}

export interface VerifyPaymentParams {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: TransactionStatus;
  gatewayPaymentId: string;
}

export interface RefundParams {
  gatewayPaymentId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: string;
}

export interface TransferParams {
  ownerAccountId: string;
  amount: number;
  bookingId: string;
  currency: string;
}

export interface TransferResult {
  transferId: string;
  amount: number;
  status: string;
}

export interface TicketParams {
  passId: string;
  playerName: string;
  venueName: string;
  venueAddress: string;
  courtName: string;
  sportName: string;
  date: string;
  slots: string[];
  totalAmount: number;
  advancePaid: number;
  remainingBalance: number;
}

export interface TicketResult {
  passId: string;
  /** Could be a URL to a PDF, a base64 QR code, or structured data for in-app rendering. */
  content: string;
  format: 'pdf' | 'qr' | 'json';
}

export interface TicketValidationResult {
  valid: boolean;
  passId: string;
  status: string;
  message?: string;
}

export interface CommissionParams {
  grossAmount: number;
  walletCreditApplied: number;
  commissionRatePercent: number;
  gatewayFeePercent?: number;
}

export interface CommissionBreakdown {
  grossAmount: number;
  walletCreditApplied: number;
  gatewayAmount: number;
  gatewayFee: number;
  platformCommission: number;
  ownerPayout: number;
}
