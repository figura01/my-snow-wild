import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1793044310416 implements MigrationInterface {
    name = 'Init1793044310416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Fonction uuid_generate_v4() utilisée par les clés primaires.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "material_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "size" character varying(40) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "position" integer NOT NULL DEFAULT '0', "materialId" uuid NOT NULL, CONSTRAINT "UQ_ced364df55653ef3eba39f52edb" UNIQUE ("materialId", "size"), CONSTRAINT "CHK_ce7c2a7dc5dceca152e922c70d" CHECK ("stock" >= 0), CONSTRAINT "PK_f16f59f8c366a96ef0e7b49f5ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "material" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "imageUrl" character varying, "dailyPriceCents" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "categoryId" uuid NOT NULL, CONSTRAINT "UQ_2e27d9ae5bd024f12fd35af717a" UNIQUE ("slug"), CONSTRAINT "CHK_359fff14b5f5a8dbdd972f9fac" CHECK ("dailyPriceCents" >= 0), CONSTRAINT "PK_0343d0d577f3effc2054cbaca7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservation_item" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "dailyPriceCents" integer NOT NULL, "reservationId" uuid, "variantId" uuid, "materialId" uuid, CONSTRAINT "CHK_e38d9221c5f18cb007b9fadbeb" CHECK ("quantity" > 0), CONSTRAINT "PK_0080a75ff7fac5703092e675f50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reservation_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "reservation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."reservation_status_enum" NOT NULL DEFAULT 'PENDING', "billingFirstName" character varying NOT NULL, "billingLastName" character varying NOT NULL, "billingEmail" character varying NOT NULL, "billingPhone" character varying NOT NULL, "billingAddress" character varying NOT NULL, "billingPostalCode" character varying(10) NOT NULL, "billingCity" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, "paidAt" TIMESTAMP WITH TIME ZONE, "stripeSessionId" character varying, "totalCents" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "CHK_36d1af9d9fb88fa332af7a51f7" CHECK ("endDate" >= "startDate"), CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "material_variant" ADD CONSTRAINT "FK_e70b257653da1b77c055ab84be6" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_87d6e1e8d033d091220960d2007" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_item" ADD CONSTRAINT "FK_95bea5815e6a171885dfaf52dad" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_item" ADD CONSTRAINT "FK_a9c45a645ce41f449f1812ad29f" FOREIGN KEY ("variantId") REFERENCES "material_variant"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation_item" ADD CONSTRAINT "FK_65da55c09a185045547bf17f4dc" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_529dceb01ef681127fef04d755d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_529dceb01ef681127fef04d755d"`);
        await queryRunner.query(`ALTER TABLE "reservation_item" DROP CONSTRAINT "FK_65da55c09a185045547bf17f4dc"`);
        await queryRunner.query(`ALTER TABLE "reservation_item" DROP CONSTRAINT "FK_a9c45a645ce41f449f1812ad29f"`);
        await queryRunner.query(`ALTER TABLE "reservation_item" DROP CONSTRAINT "FK_95bea5815e6a171885dfaf52dad"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_87d6e1e8d033d091220960d2007"`);
        await queryRunner.query(`ALTER TABLE "material_variant" DROP CONSTRAINT "FK_e70b257653da1b77c055ab84be6"`);
        await queryRunner.query(`DROP TABLE "reservation"`);
        await queryRunner.query(`DROP TYPE "public"."reservation_status_enum"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "reservation_item"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "material"`);
        await queryRunner.query(`DROP TABLE "material_variant"`);
    }

}
