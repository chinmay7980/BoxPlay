import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRefreshToken1780755037235 implements MigrationInterface {
  name = 'AddUserRefreshToken1780755037235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token_hash" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" ALTER COLUMN "commission_rate" SET DEFAULT '7.5'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venues" ALTER COLUMN "commission_rate" SET DEFAULT 7.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "refresh_token_hash"`,
    );
  }
}
