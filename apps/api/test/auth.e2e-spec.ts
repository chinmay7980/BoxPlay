import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole } from '@boxplay/shared';

describe('AuthModule (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Clean up database users created during tests
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM users WHERE email LIKE '%@test-e2e.com'",
      );
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should successfully register a player user, create their wallet, and add ₹50 bonus', async () => {
      const payload = {
        name: 'Jane Player',
        email: 'jane@test-e2e.com',
        phone: '1111111111',
        password: 'password123',
        role: UserRole.PLAYER,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        role: UserRole.PLAYER,
        walletBalance: 50.0,
      });
    });

    it('should successfully register an owner user with ₹0 wallet balance', async () => {
      const payload = {
        name: 'Bob Owner',
        email: 'bob@test-e2e.com',
        phone: '2222222222',
        password: 'password123',
        role: UserRole.OWNER,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.role).toBe(UserRole.OWNER);
      expect(response.body.user.walletBalance).toBe(0.0);
    });

    it('should throw 409 Conflict when registering with a duplicate email', async () => {
      const payload = {
        name: 'Duplicate User',
        email: 'jane@test-e2e.com',
        password: 'password123',
        role: UserRole.PLAYER,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(409);
    });

    it('should normalize email on registration and prevent duplicate conflicts regardless of case/whitespace', async () => {
      const payload = {
        name: 'Normalization Test User',
        email: '  Jane.Normalization@test-e2e.com  ',
        password: 'password123',
        role: UserRole.PLAYER,
      };

      // 1. First registration should normalize and succeed
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);

      expect(registerRes.body.user.email).toBe(
        'jane.normalization@test-e2e.com',
      );

      // 2. Second registration with duplicate email in different casing/whitespace should fail with 409 Conflict
      const duplicatePayload = {
        name: 'Duplicate Normalization User',
        email: 'JANE.NORMALIZATION@TEST-E2E.COM',
        password: 'password123',
        role: UserRole.PLAYER,
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicatePayload)
        .expect(409);

      // 3. Login with lowercase email should succeed
      const loginPayload = {
        loginId: 'jane.normalization@test-e2e.com',
        password: 'password123',
      };

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload)
        .expect(200);

      expect(loginRes.body.user.email).toBe('jane.normalization@test-e2e.com');
    });
  });

  describe('POST /auth/login', () => {
    it('should successfully authenticate user with correct credentials and return user profile', async () => {
      const payload = {
        loginId: 'jane@test-e2e.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(payload.loginId);
      expect(response.body.user.walletBalance).toBe(50.0);
    });

    it('should throw 401 Unauthorized for incorrect password', async () => {
      const payload = {
        loginId: 'jane@test-e2e.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(payload)
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should throw 401 Unauthorized when accessing without authorization token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return user profile details when a valid authorization token is supplied', async () => {
      // Login first
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginId: 'jane@test-e2e.com',
          password: 'password123',
        });

      const accessToken = loginRes.body.accessToken;

      const profileRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body).toMatchObject({
        name: 'Jane Player',
        email: 'jane@test-e2e.com',
        role: UserRole.PLAYER,
        walletBalance: 50.0,
      });
    });
  });

  describe('POST /auth/refresh & POST /auth/logout', () => {
    it('should successfully refresh tokens and then revoke them on logout', async () => {
      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          loginId: 'jane@test-e2e.com',
          password: 'password123',
        });

      const { accessToken, refreshToken, user } = loginRes.body;

      // 2. Refresh tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          userId: user.id,
          refreshToken,
        })
        .expect(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(refreshRes.body).toHaveProperty('refreshToken');

      const newAccessToken = refreshRes.body.accessToken;
      const newRefreshToken = refreshRes.body.refreshToken;

      // 3. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // 4. Try refreshing again with the old or new refresh token - should fail because logout cleared the database hash!
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          userId: user.id,
          refreshToken: newRefreshToken,
        })
        .expect(403);
    });
  });
});
