import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1780754813418 implements MigrationInterface {
  name = 'InitialSchema1780754813418';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "venue_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "venue_id" uuid NOT NULL, "url" text NOT NULL, "sort_order" smallint NOT NULL DEFAULT '0', "is_primary" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_dca6b49cd58236983f17e933e2a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "venue_amenities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "venue_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "icon_key" character varying(50), CONSTRAINT "PK_3a15fdf077849b236eea3e0e306" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sports" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "slug" character varying(60) NOT NULL, "icon_url" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_838312bddf12c427e3f66657ff3" UNIQUE ("name"), CONSTRAINT "UQ_be96c1d313b6d198a17b08f4c63" UNIQUE ("slug"), CONSTRAINT "PK_4fa1063d368e1fd68ea63c7d860" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "court_pricing_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "court_id" uuid NOT NULL, "label" character varying(80) NOT NULL, "day_of_week" smallint array, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "price_per_hour" numeric(10,2) NOT NULL, "valid_from" date, "valid_until" date, "priority" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_db85d27f585ff596eb563bacd77" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coupons_type_enum" AS ENUM('percent', 'flat')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(30) NOT NULL, "type" "public"."coupons_type_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "max_discount" numeric(10,2), "min_order_value" numeric(10,2) NOT NULL DEFAULT '0', "max_uses_total" integer, "max_uses_per_user" integer NOT NULL DEFAULT '1', "times_used" integer NOT NULL DEFAULT '0', "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL, "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_gateway_enum" AS ENUM('razorpay', 'stripe', 'wallet_only')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_payout_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('initiated', 'authorized', 'captured', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_id" uuid NOT NULL, "player_id" uuid NOT NULL, "owner_id" uuid NOT NULL, "gateway" "public"."transactions_gateway_enum" NOT NULL, "gateway_order_id" character varying(255), "gateway_payment_id" character varying(255), "gateway_signature" character varying(500), "gross_amount" numeric(10,2) NOT NULL, "wallet_credit_applied" numeric(10,2) NOT NULL DEFAULT '0', "gateway_amount" numeric(10,2) NOT NULL, "gateway_fee" numeric(10,2) NOT NULL DEFAULT '0', "platform_commission" numeric(10,2) NOT NULL, "owner_payout_amount" numeric(10,2) NOT NULL, "payout_status" "public"."transactions_payout_status_enum" NOT NULL DEFAULT 'pending', "payout_reference" character varying(255), "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'initiated', "refund_amount" numeric(10,2), "refund_reference" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fba75deb63bb89de7b5fc92746a" UNIQUE ("booking_id"), CONSTRAINT "REL_fba75deb63bb89de7b5fc92746" UNIQUE ("booking_id"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_transactions_owner" ON "transactions" ("owner_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_id" uuid NOT NULL, "player_id" uuid NOT NULL, "venue_id" uuid NOT NULL, "rating" smallint NOT NULL, "comment" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_bbd6ac6e3e6a8f8c6e0e8692d63" UNIQUE ("booking_id"), CONSTRAINT "REL_bbd6ac6e3e6a8f8c6e0e8692d6" UNIQUE ("booking_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'completed', 'cancelled', 'refunded', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pass_id" character varying(20) NOT NULL, "player_id" uuid NOT NULL, "venue_id" uuid NOT NULL, "court_id" uuid NOT NULL, "date" date NOT NULL, "slot_count" smallint NOT NULL, "subtotal" numeric(10,2) NOT NULL, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "wallet_credit_used" numeric(10,2) NOT NULL DEFAULT '0', "total_amount" numeric(10,2) NOT NULL, "platform_commission" numeric(10,2) NOT NULL, "owner_payout" numeric(10,2) NOT NULL, "coupon_id" uuid, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "cancellation_reason" text, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_518ae83e7b84373df11b479a769" UNIQUE ("pass_id"), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_venue" ON "bookings" ("venue_id", "date", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bookings_player" ON "bookings" ("player_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."slots_status_enum" AS ENUM('available', 'locked', 'booked', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "court_id" uuid NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "price" numeric(10,2) NOT NULL, "status" "public"."slots_status_enum" NOT NULL DEFAULT 'available', "locked_by" uuid, "lock_until" TIMESTAMP WITH TIME ZONE, "blocked_reason" character varying(200), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7a336b4985b5ea28a3cd40270f" UNIQUE ("court_id", "date", "start_time"), CONSTRAINT "PK_8b553bb1941663b63fd38405e42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_slots_court_date_status" ON "slots" ("court_id", "date", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "courts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "venue_id" uuid NOT NULL, "sport_id" integer NOT NULL, "name" character varying(120) NOT NULL, "description" text, "base_price_per_hour" numeric(10,2) NOT NULL, "max_players" smallint, "surface_type" character varying(60), "is_indoor" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_948a5d356c3083f3237ecbf9897" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."venues_status_enum" AS ENUM('draft', 'pending_approval', 'active', 'suspended', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "venues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "slug" character varying(200) NOT NULL, "description" text, "address_line" character varying(500) NOT NULL, "city" character varying(100) NOT NULL, "state" character varying(100), "pincode" character varying(10), "latitude" numeric(10,8), "longitude" numeric(11,8), "maps_link" text, "rating_avg" numeric(2,1) NOT NULL DEFAULT '0', "reviews_count" integer NOT NULL DEFAULT '0', "status" "public"."venues_status_enum" NOT NULL DEFAULT 'draft', "commission_rate" numeric(4,2) NOT NULL DEFAULT '7.5', "open_time" TIME NOT NULL DEFAULT '06:00:00', "close_time" TIME NOT NULL DEFAULT '00:00:00', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_9fd71efb7abb246a69847399d14" UNIQUE ("slug"), CONSTRAINT "PK_cb0f885278d12384eb7a81818be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_transactions_type_enum" AS ENUM('credit', 'debit')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_transactions_reason_enum" AS ENUM('signup_bonus', 'referral', 'refund', 'booking_redemption', 'admin_adjustment', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallet_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "type" "public"."wallet_transactions_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "reason" "public"."wallet_transactions_reason_enum" NOT NULL, "reference_id" uuid, "description" character varying(300), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5120f131bde2cda940ec1a621db" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_wallet_txn" ON "wallet_transactions" ("wallet_id", "type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_92558c08091598f7a4439586cda" UNIQUE ("user_id"), CONSTRAINT "REL_92558c08091598f7a4439586cd" UNIQUE ("user_id"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('player', 'owner', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_onboarding_status_enum" AS ENUM('pending', 'approved', 'rejected', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."users_role_enum" NOT NULL DEFAULT 'player', "name" character varying(120) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "password_hash" character varying(255) NOT NULL, "avatar_url" text, "is_verified" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "stripe_account_id" character varying(255), "onboarding_status" "public"."users_onboarding_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_slots" ("booking_id" uuid NOT NULL, "slot_id" uuid NOT NULL, CONSTRAINT "PK_1182ffb1c5912165c3162276437" PRIMARY KEY ("booking_id", "slot_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2412aee53f210614ab4d37cbcd" ON "booking_slots" ("booking_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c75ab35c1a65fa097c61040364" ON "booking_slots" ("slot_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "venue_sports" ("venue_id" uuid NOT NULL, "sport_id" integer NOT NULL, CONSTRAINT "PK_03de60d8e4e856ffa6316146831" PRIMARY KEY ("venue_id", "sport_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8629f831c8d696a46175fa0205" ON "venue_sports" ("venue_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b253125da47b69d4a28f549c29" ON "venue_sports" ("sport_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_photos" ADD CONSTRAINT "FK_bb7918d3a024b822e0e96c2d87a" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_amenities" ADD CONSTRAINT "FK_52aa3f633512f7a025e288ba8eb" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "court_pricing_rules" ADD CONSTRAINT "FK_3314f3f2c636336994aa5f50e24" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_fba75deb63bb89de7b5fc92746a" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_05767b4dc6ebb80a49f03a755fd" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6a37d470277421e5b1241263a12" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_bbd6ac6e3e6a8f8c6e0e8692d63" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_956680ba5490b04f7cc38846138" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_892f659696877d5b0a4a37de098" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_129e7fe11e40d931c7bfdcf7e04" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_9285e4f67f013d21d8d9905b1e8" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_2bd7e9c03db9f51a4765974abb8" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_23ec6943dfbd6fb667f629e990b" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ADD CONSTRAINT "FK_f760eb2b0003ce02b67c15e646d" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" ADD CONSTRAINT "FK_a3afb3b4d2f40466cc064e31549" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courts" ADD CONSTRAINT "FK_9da2e37c269dfe8cbbfd8d87583" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courts" ADD CONSTRAINT "FK_ac2464be4d993092d8eeb643bad" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" ADD CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" ADD CONSTRAINT "FK_c57d19129968160f4db28fc8b28" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_slots" ADD CONSTRAINT "FK_2412aee53f210614ab4d37cbcd9" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_slots" ADD CONSTRAINT "FK_c75ab35c1a65fa097c610403648" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_sports" ADD CONSTRAINT "FK_8629f831c8d696a46175fa02057" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_sports" ADD CONSTRAINT "FK_b253125da47b69d4a28f549c291" FOREIGN KEY ("sport_id") REFERENCES "sports"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venue_sports" DROP CONSTRAINT "FK_b253125da47b69d4a28f549c291"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_sports" DROP CONSTRAINT "FK_8629f831c8d696a46175fa02057"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_slots" DROP CONSTRAINT "FK_c75ab35c1a65fa097c610403648"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_slots" DROP CONSTRAINT "FK_2412aee53f210614ab4d37cbcd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallet_transactions" DROP CONSTRAINT "FK_c57d19129968160f4db28fc8b28"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" DROP CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courts" DROP CONSTRAINT "FK_ac2464be4d993092d8eeb643bad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courts" DROP CONSTRAINT "FK_9da2e37c269dfe8cbbfd8d87583"`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" DROP CONSTRAINT "FK_a3afb3b4d2f40466cc064e31549"`,
    );
    await queryRunner.query(
      `ALTER TABLE "slots" DROP CONSTRAINT "FK_f760eb2b0003ce02b67c15e646d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_23ec6943dfbd6fb667f629e990b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_2bd7e9c03db9f51a4765974abb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_9285e4f67f013d21d8d9905b1e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_129e7fe11e40d931c7bfdcf7e04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_892f659696877d5b0a4a37de098"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_956680ba5490b04f7cc38846138"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_bbd6ac6e3e6a8f8c6e0e8692d63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6a37d470277421e5b1241263a12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_05767b4dc6ebb80a49f03a755fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_fba75deb63bb89de7b5fc92746a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "court_pricing_rules" DROP CONSTRAINT "FK_3314f3f2c636336994aa5f50e24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_amenities" DROP CONSTRAINT "FK_52aa3f633512f7a025e288ba8eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_photos" DROP CONSTRAINT "FK_bb7918d3a024b822e0e96c2d87a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b253125da47b69d4a28f549c29"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8629f831c8d696a46175fa0205"`,
    );
    await queryRunner.query(`DROP TABLE "venue_sports"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c75ab35c1a65fa097c61040364"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2412aee53f210614ab4d37cbcd"`,
    );
    await queryRunner.query(`DROP TABLE "booking_slots"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP TYPE "public"."users_onboarding_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP INDEX "public"."idx_wallet_txn"`);
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_reason_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."wallet_transactions_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "venues"`);
    await queryRunner.query(`DROP TYPE "public"."venues_status_enum"`);
    await queryRunner.query(`DROP TABLE "courts"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_slots_court_date_status"`,
    );
    await queryRunner.query(`DROP TABLE "slots"`);
    await queryRunner.query(`DROP TYPE "public"."slots_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_player"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bookings_venue"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transactions_owner"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."transactions_payout_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."transactions_gateway_enum"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_type_enum"`);
    await queryRunner.query(`DROP TABLE "court_pricing_rules"`);
    await queryRunner.query(`DROP TABLE "sports"`);
    await queryRunner.query(`DROP TABLE "venue_amenities"`);
    await queryRunner.query(`DROP TABLE "venue_photos"`);
  }
}
