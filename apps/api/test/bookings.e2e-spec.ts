import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import {
  UserRole,
  SlotStatus,
  BookingStatus,
  CouponType,
  VenueStatus,
} from '@boxplay/shared';
import { Sport } from '../src/database/entities/sport.entity';
import { Venue } from '../src/database/entities/venue.entity';
import { Court } from '../src/database/entities/court.entity';
import { Slot } from '../src/database/entities/slot.entity';
import { Coupon } from '../src/database/entities/coupon.entity';
import { User } from '../src/database/entities/user.entity';

describe('Bookings & Slots Engine (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let dataSource: DataSource;
  let savedSport: Sport;
  let testVenue: Venue;
  let testCourt: Court;
  let testSlots: Slot[] = [];

  let playerAToken: string;
  let playerAId: string;
  let playerBToken: string;
  let playerBId: string;
  let ownerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 1. Get or create a Sport
    const sportRepo = dataSource.getRepository(Sport);
    const sports = await sportRepo.find();
    if (sports.length === 0) {
      savedSport = await sportRepo.save(
        sportRepo.create({ name: 'E2E Sport', slug: 'e2e-sport' }),
      );
    } else {
      savedSport = sports[0];
    }

    // 2. Register & login Player A, Player B, and Owner
    const uniqueEmail = () =>
      `user-${Date.now()}-${Math.random()}@test-e2e.com`;

    const registerAndLogin = async (role: UserRole, name: string) => {
      const email = uniqueEmail();
      const phone = Math.floor(
        1000000000 + Math.random() * 9000000000,
      ).toString();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name,
          email,
          phone,
          password: 'password123',
          role,
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginId: email,
          password: 'password123',
        })
        .expect(200);

      return {
        token: loginRes.body.accessToken,
        id: loginRes.body.user.id,
      };
    };

    const playerA = await registerAndLogin(UserRole.PLAYER, 'E2E Player A');
    playerAToken = playerA.token;
    playerAId = playerA.id;

    const playerB = await registerAndLogin(UserRole.PLAYER, 'E2E Player B');
    playerBToken = playerB.token;
    playerBId = playerB.id;

    const owner = await registerAndLogin(UserRole.OWNER, 'E2E Owner');
    ownerToken = owner.token;

    // 3. Setup a Venue and Court
    const userRepo = dataSource.getRepository(User);
    const ownerUser = await userRepo.findOne({ where: { id: owner.id } });

    const venueRepo = dataSource.getRepository(Venue);
    testVenue = await venueRepo.save(
      venueRepo.create({
        ownerId: owner.id,
        name: 'E2E Turf Arena',
        slug: `e2e-turf-arena-${Date.now()}`,
        addressLine: '123 Turf Street',
        city: 'Udaipur',
        status: VenueStatus.ACTIVE, // Approved status
        commissionRate: 10.0,
        openTime: '06:00:00',
        closeTime: '22:00:00',
      }),
    );

    // Let's force approval status in DB so listing works if needed (though we've set it directly)
    testVenue.status = 'active' as any;
    await venueRepo.save(testVenue);

    const courtRepo = dataSource.getRepository(Court);
    testCourt = await courtRepo.save(
      courtRepo.create({
        venueId: testVenue.id,
        sportId: savedSport.id,
        name: 'E2E Court Arena 1',
        basePricePerHour: 1000.0,
        maxPlayers: 10,
        surfaceType: 'Turf',
        isIndoor: false,
        isActive: true,
      }),
    );

    // 4. Create Slots
    const slotRepo = dataSource.getRepository(Slot);
    const dateStr = new Date().toISOString().split('T')[0];
    testSlots = await slotRepo.save([
      slotRepo.create({
        courtId: testCourt.id,
        date: dateStr,
        startTime: '10:00:00',
        endTime: '11:00:00',
        price: 1000.0,
        status: SlotStatus.AVAILABLE,
      }),
      slotRepo.create({
        courtId: testCourt.id,
        date: dateStr,
        startTime: '11:00:00',
        endTime: '12:00:00',
        price: 1000.0,
        status: SlotStatus.AVAILABLE,
      }),
      slotRepo.create({
        courtId: testCourt.id,
        date: dateStr,
        startTime: '12:00:00',
        endTime: '13:00:00',
        price: 1000.0,
        status: SlotStatus.AVAILABLE,
      }),
    ]);
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query('DELETE FROM booking_slots');
      await dataSource.query("DELETE FROM bookings WHERE pass_id LIKE 'BP-%'");
      await dataSource.query('DELETE FROM wallet_transactions');
      await dataSource.query('DELETE FROM wallets');
      await dataSource.query('DELETE FROM slots');
      await dataSource.query("DELETE FROM courts WHERE name LIKE '%E2E%'");
      await dataSource.query("DELETE FROM venues WHERE name LIKE '%E2E%'");
      await dataSource.query("DELETE FROM coupons WHERE code LIKE 'E2E%'");
      await dataSource.query(
        "DELETE FROM users WHERE email LIKE '%@test-e2e.com'",
      );
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('GET /courts/:courtId/slots', () => {
    it('should retrieve list of slots for court on specified date', async () => {
      const dateStr = testSlots[0].date;
      const res = await request(app.getHttpServer())
        .get(`/courts/${testCourt.id}/slots?date=${dateStr}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0].courtId).toBe(testCourt.id);
    });
  });

  describe('POST /slots/:id/lock', () => {
    it('should successfully lock a slot for Player A for 10 minutes', async () => {
      const slotId = testSlots[0].id;
      const res = await request(app.getHttpServer())
        .post(`/slots/${slotId}/lock`)
        .set('Authorization', `Bearer ${playerAToken}`)
        .expect(200);

      expect(res.body.status).toBe(SlotStatus.LOCKED);
      expect(res.body.lockedBy).toBe(playerAId);
      expect(res.body.lockUntil).toBeDefined();
    });

    it('should reject locking the same slot by Player B (409 Conflict)', async () => {
      const slotId = testSlots[0].id;
      await request(app.getHttpServer())
        .post(`/slots/${slotId}/lock`)
        .set('Authorization', `Bearer ${playerBToken}`)
        .expect(409);
    });
  });

  describe('POST /coupons/validate', () => {
    let testCoupon: Coupon;

    beforeAll(async () => {
      const couponRepo = dataSource.getRepository(Coupon);
      testCoupon = await couponRepo.save(
        couponRepo.create({
          code: 'E2ETEST50',
          type: CouponType.FLAT,
          value: 50.0,
          minOrderValue: 100.0,
          isActive: true,
          validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        }),
      );
    });

    it('should successfully validate coupon and compute discount for valid total amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/coupons/validate')
        .set('Authorization', `Bearer ${playerAToken}`)
        .send({
          code: 'E2ETEST50',
          totalAmount: 1000.0,
        })
        .expect(200);

      expect(res.body.valid).toBe(true);
      expect(res.body.discount).toBe(50.0);
      expect(res.body.newTotal).toBe(950.0);
    });

    it('should reject validation for coupon with order total below minOrderValue', async () => {
      const res = await request(app.getHttpServer())
        .post('/coupons/validate')
        .set('Authorization', `Bearer ${playerAToken}`)
        .send({
          code: 'E2ETEST50',
          totalAmount: 40.0,
        })
        .expect(200);

      expect(res.body.valid).toBe(false);
      expect(res.body.message).toContain('Minimum order value');
    });
  });

  describe('POST /bookings', () => {
    it('should prevent Player B from booking slot locked by Player A (409 Conflict)', async () => {
      const payload = {
        courtId: testCourt.id,
        date: testSlots[0].date,
        slotIds: [testSlots[0].id],
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${playerBToken}`)
        .send(payload)
        .expect(409);
    });

    it('should successfully allow Player A to book slot they locked, utilizing wallet credits & coupon', async () => {
      // 1. Double check Player A balance starts at 50 (Signup bonus)
      const walletRes = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${playerAToken}`)
        .expect(200);

      expect(walletRes.body.balance).toBe(50.0);

      // 2. Book slot
      const payload = {
        courtId: testCourt.id,
        date: testSlots[0].date,
        slotIds: [testSlots[0].id],
        couponCode: 'E2ETEST50',
        walletCreditAmount: 50.0,
      };

      const res = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${playerAToken}`)
        .send(payload)
        .expect(201);

      // Calculations:
      // Subtotal = 1000
      // Coupon = FLAT 50 discount => 950
      // Wallet = 50 => 900
      // Platform commission = 10% of subtotal (1000) = 100
      // Owner payout = Total amount (900) - platform commission (100) = 800
      expect(res.body).toHaveProperty('id');
      expect(res.body.passId).toMatch(/^BP-\d{6}$/);
      expect(res.body.subtotal).toBe(1000.0);
      expect(res.body.discountAmount).toBe(50.0);
      expect(res.body.walletCreditUsed).toBe(50.0);
      expect(res.body.totalAmount).toBe(900.0);
      expect(res.body.platformCommission).toBe(100.0);
      expect(res.body.ownerPayout).toBe(800.0);
      expect(res.body.status).toBe(BookingStatus.CONFIRMED);

      // 3. Verify Player A balance is now 0.00
      const walletResAfter = await request(app.getHttpServer())
        .get('/wallet/balance')
        .set('Authorization', `Bearer ${playerAToken}`)
        .expect(200);
      expect(walletResAfter.body.balance).toBe(0.0);
      expect(walletResAfter.body.transactions).toHaveLength(2); // signup bonus + booking redemption
      expect(walletResAfter.body.transactions[0].type).toBe('debit');

      // 4. Verify slot status is updated to BOOKED in DB
      const slotRepo = dataSource.getRepository(Slot);
      const slot = await slotRepo.findOne({ where: { id: testSlots[0].id } });
      expect(slot?.status).toBe(SlotStatus.BOOKED);
      expect(slot?.lockedBy).toBeNull();
    });

    it('should reject double-booking of a slot already booked (409 Conflict)', async () => {
      const payload = {
        courtId: testCourt.id,
        date: testSlots[0].date,
        slotIds: [testSlots[0].id],
      };

      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${playerBToken}`)
        .send(payload)
        .expect(409);
    });
  });
});
