import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTopupToReasonEnum1780755037236 implements MigrationInterface {
  name = 'AddTopupToReasonEnum1780755037236';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."wallet_transactions_reason_enum" ADD VALUE 'topup'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting custom Postgres enum values is not directly supported by PG without recreation.
    // We leave the type as is or handle it as a no-op on downgrade to prevent issues.
  }
}
