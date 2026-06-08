import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole, VenueStatus } from '@boxplay/shared';
import { Sport } from '../src/database/entities/sport.entity';

describe('Venues & Courts Module (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let dataSource: DataSource;
  let ownerToken: string;
  let otherOwnerToken: string;
  let adminToken: string;
  let playerToken: string;
  let savedSport: Sport;
  let testVenueId: string;
  let testVenueSlug: string;
  let testCourtId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // 1. Get a sport from the seeded database to use in court tests
    const sportRepo = dataSource.getRepository(Sport);
    const sports = await sportRepo.find();
    if (sports.length === 0) {
      savedSport = await sportRepo.save(
        sportRepo.create({ name: 'E2E Sport', slug: 'e2e-sport' }),
      );
    } else {
      savedSport = sports[0];
    }

    // 2. Register and Login users
    const uniqueEmail = () =>
      `user-${Date.now()}-${Math.random()}@test-e2e.com`;

    const registerAndLogin = async (role: UserRole) => {
      const email = uniqueEmail();
      const regRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `E2E ${role}`,
          email,
          phone: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          password: 'password123',
          role,
        });

      if (regRes.status !== 201) {
        console.error('Registration failed:', regRes.status, regRes.body);
      }

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginId: email,
          password: 'password123',
        });

      if (loginRes.status !== 200) {
        console.error('Login failed:', loginRes.status, loginRes.body);
      }

      return loginRes.body.accessToken;
    };

    ownerToken = await registerAndLogin(UserRole.OWNER);
    otherOwnerToken = await registerAndLogin(UserRole.OWNER);
    adminToken = await registerAndLogin(UserRole.ADMIN);
    playerToken = await registerAndLogin(UserRole.PLAYER);
  });

  afterAll(async () => {
    // Cleanup users, wallets, and nested data
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM venue_photos WHERE url LIKE '%test-e2e.com%'",
      );
      await dataSource.query(
        "DELETE FROM venue_amenities WHERE name LIKE '%E2E%'",
      );
      await dataSource.query("DELETE FROM courts WHERE name LIKE '%E2E%'");
      await dataSource.query("DELETE FROM venues WHERE name LIKE '%E2E%'");
      await dataSource.query(
        "DELETE FROM users WHERE email LIKE '%@test-e2e.com'",
      );
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('POST /venues', () => {
    it('should allow an owner to create a venue in draft state', async () => {
      const payload = {
        name: 'E2E Sports Center',
        description: 'Elite turf for test matches.',
        addressLine: 'Block C, Tech Park',
        city: 'Noida',
        sportIds: [savedSport.id],
        amenities: [{ name: 'E2E Locker Rooms' }, { name: 'E2E Parking' }],
        photos: [{ url: 'http://test-e2e.com/photo1.jpg' }],
      };

      const response = await request(app.getHttpServer())
        .post('/venues')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(VenueStatus.DRAFT);
      expect(response.body.name).toBe(payload.name);
      expect(response.body.slug).toBe('e2e-sports-center');

      testVenueId = response.body.id;
      testVenueSlug = response.body.slug;
    });

    it('should throw 403 Forbidden when a player attempts to create a venue', async () => {
      await request(app.getHttpServer())
        .post('/venues')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'E2E Player Center',
          addressLine: 'Some Road',
          city: 'Delhi',
        })
        .expect(403);
    });
  });

  describe('POST /venues/:venueId/courts', () => {
    it('should allow the owner to add a court to their venue', async () => {
      const payload = {
        name: 'E2E Court Alpha',
        sportId: savedSport.id,
        basePricePerHour: 1200.0,
        maxPlayers: 10,
        surfaceType: 'Turf',
        isIndoor: false,
      };

      const response = await request(app.getHttpServer())
        .post(`/venues/${testVenueId}/courts`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(payload.name);
      expect(response.body.venueId).toBe(testVenueId);

      testCourtId = response.body.id;
    });

    it('should throw 403 Forbidden when a different owner tries to add a court to the venue', async () => {
      await request(app.getHttpServer())
        .post(`/venues/${testVenueId}/courts`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          name: 'Intruder Court',
          sportId: savedSport.id,
          basePricePerHour: 1000.0,
        })
        .expect(403);
    });
  });

  describe('GET /venues (listings)', () => {
    it('should not include the draft venue in public listings', async () => {
      const response = await request(app.getHttpServer())
        .get('/venues?city=noida')
        .expect(200);

      const found = response.body.find((v: any) => v.id === testVenueId);
      expect(found).toBeUndefined();
    });

    it('should allow an admin to approve the draft venue', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/venues/${testVenueId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe(VenueStatus.ACTIVE);
    });

    it('should now include the approved active venue in public listings', async () => {
      const response = await request(app.getHttpServer())
        .get('/venues?city=noida')
        .expect(200);

      const found = response.body.find((v: any) => v.id === testVenueId);
      expect(found).toBeDefined();
      expect(found.name).toBe('E2E Sports Center');
      expect(found.minPricePerHour).toBe(1200.0); // Derived minimum court price
    });
  });

  describe('GET /venues/:slug (detailed view)', () => {
    it('should return nested details of photos, amenities, and courts', async () => {
      const response = await request(app.getHttpServer())
        .get(`/venues/${testVenueSlug}`)
        .expect(200);

      expect(response.body.id).toBe(testVenueId);
      expect(response.body.amenities).toContain('E2E Locker Rooms');
      expect(response.body.photos[0].url).toBe(
        'http://test-e2e.com/photo1.jpg',
      );
      expect(response.body.courts).toHaveLength(1);
      expect(response.body.courts[0].id).toBe(testCourtId);
    });
  });

  describe('PATCH & DELETE actions (permissions checks)', () => {
    it('should allow owner to update their court details', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/courts/${testCourtId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ basePricePerHour: 1500.0 })
        .expect(200);

      expect(response.body.basePricePerHour).toBe(1500.0);
    });

    it('should throw 403 when other owner tries to delete the court', async () => {
      await request(app.getHttpServer())
        .delete(`/courts/${testCourtId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(403);
    });

    it('should allow owner to soft-delete their court', async () => {
      await request(app.getHttpServer())
        .delete(`/courts/${testCourtId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);
    });

    it('should allow owner to soft-delete their venue', async () => {
      await request(app.getHttpServer())
        .delete(`/venues/${testVenueId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(204);
    });
  });
});
