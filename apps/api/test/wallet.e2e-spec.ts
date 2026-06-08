import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { UserRole, type WalletBalanceDto, type AuthResponseDto } from '@boxplay/shared';

describe('WalletModule (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register a new test user to get an auth token
    testEmail = `wallet-user-${Date.now()}@test-e2e.com`;
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Wallet Test User',
        email: testEmail,
        password: 'password123',
        role: UserRole.PLAYER,
      })
      .expect(201);

    const body = response.body as unknown as AuthResponseDto;
    authToken = body.accessToken;
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.query(
        "DELETE FROM users WHERE email LIKE '%@test-e2e.com'",
      );
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('POST /wallet/topup', () => {
    it('should successfully top up wallet and return the updated balance and transaction list', async () => {
      const topupAmount = 150.0;

      const response = await request(app.getHttpServer())
        .post('/wallet/topup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: topupAmount })
        .expect(200);

      const body = response.body as unknown as WalletBalanceDto;

      // Player signup bonus is 50.0, so 50.0 + 150.0 = 200.0
      expect(body.balance).toBe(200.0);
      expect(body.transactions.length).toBe(2);

      // Verify the new transaction details
      const topupTx = body.transactions.find((tx) => tx.reason === 'topup');
      expect(topupTx).toBeDefined();
      expect(topupTx?.amount).toBe(150.0);
      expect(topupTx?.type).toBe('credit');
    });

    it('should throw 400 Bad Request when amount is negative', async () => {
      await request(app.getHttpServer())
        .post('/wallet/topup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: -50.0 })
        .expect(400);
    });

    it('should throw 400 Bad Request when amount is zero', async () => {
      await request(app.getHttpServer())
        .post('/wallet/topup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 0 })
        .expect(400);
    });

    it('should throw 401 Unauthorized when no auth token is provided', async () => {
      await request(app.getHttpServer())
        .post('/wallet/topup')
        .send({ amount: 100.0 })
        .expect(401);
    });
  });
});
