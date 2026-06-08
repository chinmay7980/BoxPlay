import { AppDataSource } from './data-source';
import {
  User,
  Sport,
  Venue,
  VenuePhoto,
  VenueAmenity,
  Court,
  CourtPricingRule,
  Slot,
  Wallet,
  WalletTransaction,
  Coupon,
} from './entities';
import {
  UserRole,
  OnboardingStatus,
  VenueStatus,
  SlotStatus,
  WalletTransactionType,
  WalletTransactionReason,
  CouponType,
} from '@boxplay/shared';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('Initializing database connection for seeding...');
  await AppDataSource.initialize();
  console.log('Database connected successfully.');

  const manager = AppDataSource.manager;

  console.log('Cleaning up existing database tables...');
  await manager.query('TRUNCATE TABLE "booking_slots" CASCADE;');
  await manager.query('TRUNCATE TABLE "venue_sports" CASCADE;');
  await manager.query('TRUNCATE TABLE "wallet_transactions" CASCADE;');
  await manager.query('TRUNCATE TABLE "wallets" CASCADE;');
  await manager.query('TRUNCATE TABLE "court_pricing_rules" CASCADE;');
  await manager.query('TRUNCATE TABLE "slots" CASCADE;');
  await manager.query('TRUNCATE TABLE "bookings" CASCADE;');
  await manager.query('TRUNCATE TABLE "transactions" CASCADE;');
  await manager.query('TRUNCATE TABLE "reviews" CASCADE;');
  await manager.query('TRUNCATE TABLE "courts" CASCADE;');
  await manager.query('TRUNCATE TABLE "venue_photos" CASCADE;');
  await manager.query('TRUNCATE TABLE "venue_amenities" CASCADE;');
  await manager.query('TRUNCATE TABLE "venues" CASCADE;');
  await manager.query('TRUNCATE TABLE "users" CASCADE;');
  await manager.query('TRUNCATE TABLE "sports" CASCADE;');
  await manager.query('TRUNCATE TABLE "coupons" CASCADE;');
  console.log('Database tables cleared.');

  // 1. Seed Sports
  console.log('Seeding sports...');
  const sportsData = [
    {
      name: 'Football',
      slug: 'football',
      iconUrl: 'sports_soccer',
      isActive: true,
    },
    {
      name: 'Cricket',
      slug: 'cricket',
      iconUrl: 'sports_cricket',
      isActive: true,
    },
    {
      name: 'Badminton',
      slug: 'badminton',
      iconUrl: 'sports_tennis',
      isActive: true,
    },
    {
      name: 'Pickleball',
      slug: 'pickleball',
      iconUrl: 'sports_handball',
      isActive: true,
    },
    {
      name: 'Basketball',
      slug: 'basketball',
      iconUrl: 'sports_basketball',
      isActive: true,
    },
    {
      name: 'Tennis',
      slug: 'tennis',
      iconUrl: 'sports_tennis',
      isActive: true,
    },
  ];
  const sports: Sport[] = [];
  for (const s of sportsData) {
    const sport = manager.create(Sport, s);
    sports.push(await manager.save(Sport, sport));
  }
  console.log(`Seeded ${sports.length} sports.`);

  // 2. Seed Users
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const playerUser = manager.create(User, {
    role: UserRole.PLAYER,
    name: 'John Player',
    email: 'player@boxplay.com',
    phone: '9876543210',
    passwordHash,
    isVerified: true,
    isActive: true,
  });
  const savedPlayer = await manager.save(User, playerUser);

  const ownerUser = manager.create(User, {
    role: UserRole.OWNER,
    name: 'Sarah Owner',
    email: 'owner@boxplay.com',
    phone: '9876543211',
    passwordHash,
    isVerified: true,
    isActive: true,
    stripeAccountId: 'acc_rzp_test_owner_1',
    onboardingStatus: OnboardingStatus.APPROVED,
  });
  const savedOwner = await manager.save(User, ownerUser);

  const adminUser = manager.create(User, {
    role: UserRole.ADMIN,
    name: 'Alex Admin',
    email: 'admin@boxplay.com',
    phone: '9876543212',
    passwordHash,
    isVerified: true,
    isActive: true,
  });
  await manager.save(User, adminUser);
  console.log('Seeded users: Player, Owner, Admin.');

  // 3. Seed Wallets & Signup Bonus
  console.log('Seeding wallets...');
  const playerWallet = manager.create(Wallet, {
    userId: savedPlayer.id,
  });
  const savedWallet = await manager.save(Wallet, playerWallet);

  const signupBonus = manager.create(WalletTransaction, {
    walletId: savedWallet.id,
    type: WalletTransactionType.CREDIT,
    amount: 50.0,
    reason: WalletTransactionReason.SIGNUP_BONUS,
    description: 'Signup bonus credit of ₹50',
  });
  await manager.save(WalletTransaction, signupBonus);
  console.log('Seeded wallet with ₹50 signup bonus.');

  // 4. Seed Venue
  console.log('Seeding venue...');
  const venue = manager.create(Venue, {
    ownerId: savedOwner.id,
    name: 'BoxPlay Arena & Turf',
    slug: 'boxplay-arena-turf',
    description:
      'Premier sports destination with high-quality artificial football turf and indoor wooden badminton courts.',
    addressLine: 'Sector 62, Near Metro Station',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.6273,
    longitude: 77.3725,
    mapsLink: 'https://maps.google.com/?q=28.6273,77.3725',
    ratingAvg: 4.8,
    reviewsCount: 1,
    status: VenueStatus.ACTIVE,
    commissionRate: 7.5,
    openTime: '06:00:00',
    closeTime: '23:59:00',
  });
  // Connect sports
  venue.sports = [sports[0], sports[2]]; // Football & Badminton
  const savedVenue = await manager.save(Venue, venue);
  console.log('Seeded venue.');

  // 5. Seed Venue Photos & Amenities
  console.log('Seeding venue photos & amenities...');
  const photos = [
    manager.create(VenuePhoto, {
      venueId: savedVenue.id,
      url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=800',
      sortOrder: 0,
      isPrimary: true,
    }),
    manager.create(VenuePhoto, {
      venueId: savedVenue.id,
      url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800',
      sortOrder: 1,
      isPrimary: false,
    }),
  ];
  await manager.save(VenuePhoto, photos);

  const amenities = [
    manager.create(VenueAmenity, {
      venueId: savedVenue.id,
      name: 'Changing Rooms',
      iconKey: 'checkroom',
    }),
    manager.create(VenueAmenity, {
      venueId: savedVenue.id,
      name: 'Free Parking',
      iconKey: 'local_parking',
    }),
    manager.create(VenueAmenity, {
      venueId: savedVenue.id,
      name: 'Drinking Water',
      iconKey: 'water_drop',
    }),
    manager.create(VenueAmenity, {
      venueId: savedVenue.id,
      name: 'Showers',
      iconKey: 'shower',
    }),
  ];
  await manager.save(VenueAmenity, amenities);
  console.log('Seeded venue photos and amenities.');

  // 6. Seed Courts
  console.log('Seeding courts...');
  const footballSport = sports.find((s) => s.slug === 'football')!;
  const badmintonSport = sports.find((s) => s.slug === 'badminton')!;

  const footballCourt = manager.create(Court, {
    venueId: savedVenue.id,
    sportId: footballSport.id,
    name: 'Champions Arena (5v5)',
    description:
      'Premium FIFA-grade FIFA Pro artificial turf designed for high intensity 5-a-side matches.',
    basePricePerHour: 1500.0,
    maxPlayers: 10,
    surfaceType: 'Artificial Turf',
    isIndoor: false,
    isActive: true,
  });
  const savedFootballCourt = await manager.save(Court, footballCourt);

  const badmintonCourt = manager.create(Court, {
    venueId: savedVenue.id,
    sportId: badmintonSport.id,
    name: 'Court 1 (Indoor Wood)',
    description:
      'Professional indoor court with high shock absorption wooden flooring and bright shadow-free lighting.',
    basePricePerHour: 400.0,
    maxPlayers: 4,
    surfaceType: 'Teak Wooden Flooring',
    isIndoor: true,
    isActive: true,
  });
  const savedBadmintonCourt = await manager.save(Court, badmintonCourt);
  console.log('Seeded courts.');

  // 7. Seed Pricing Rules
  console.log('Seeding court pricing rules...');
  // Weekend pricing: Sat & Sun (0 & 6) increase price for Football Court to ₹1800 from 16:00 to 22:00
  const pricingRule = manager.create(CourtPricingRule, {
    courtId: savedFootballCourt.id,
    label: 'Weekend Evening Premium',
    dayOfWeek: [0, 6],
    startTime: '16:00:00',
    endTime: '22:00:00',
    pricePerHour: 1800.0,
    priority: 1,
  });
  await manager.save(CourtPricingRule, pricingRule);
  console.log('Seeded pricing rules.');

  // 8. Seed Slots (for today and tomorrow)
  console.log('Seeding slots...');
  const dates = [
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  ];

  const slotHours = [
    { start: '06:00:00', end: '07:00:00' },
    { start: '07:00:00', end: '08:00:00' },
    { start: '08:00:00', end: '09:00:00' },
    { start: '16:00:00', end: '17:00:00' },
    { start: '17:00:00', end: '18:00:00' },
    { start: '18:00:00', end: '19:00:00' },
    { start: '19:00:00', end: '20:00:00' },
    { start: '20:00:00', end: '21:00:00' },
    { start: '21:00:00', end: '22:00:00' },
  ];

  let slotsCreated = 0;
  for (const date of dates) {
    const isWeekend =
      new Date(date).getDay() === 0 || new Date(date).getDay() === 6;

    for (const sh of slotHours) {
      // Football
      let footballPrice = savedFootballCourt.basePricePerHour;
      if (isWeekend && sh.start >= '16:00:00' && sh.start < '22:00:00') {
        footballPrice = 1800.0;
      }
      const footballSlot = manager.create(Slot, {
        courtId: savedFootballCourt.id,
        date,
        startTime: sh.start,
        endTime: sh.end,
        price: footballPrice,
        status: SlotStatus.AVAILABLE,
      });
      await manager.save(Slot, footballSlot);

      // Badminton
      const badmintonSlot = manager.create(Slot, {
        courtId: savedBadmintonCourt.id,
        date,
        startTime: sh.start,
        endTime: sh.end,
        price: savedBadmintonCourt.basePricePerHour,
        status: SlotStatus.AVAILABLE,
      });
      await manager.save(Slot, badmintonSlot);

      slotsCreated += 2;
    }
  }
  console.log(`Seeded ${slotsCreated} slots across 2 days.`);

  // 9. Seed Coupons
  console.log('Seeding coupons...');
  const coupons = [
    manager.create(Coupon, {
      code: 'BOXPLAY50',
      type: CouponType.FLAT,
      value: 50.0,
      minOrderValue: 200.0,
      maxUsesTotal: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 86400000), // 30 days
      isActive: true,
    }),
    manager.create(Coupon, {
      code: 'WELCOME10',
      type: CouponType.PERCENT,
      value: 10.0,
      maxDiscount: 100.0,
      minOrderValue: 300.0,
      maxUsesTotal: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 86400000),
      isActive: true,
    }),
  ];
  await manager.save(Coupon, coupons);
  console.log('Seeded coupons.');

  console.log('Seeding process completed successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error during seeding database:', err);
  process.exit(1);
});
