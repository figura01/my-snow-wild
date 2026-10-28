import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoices1793201194374 implements MigrationInterface {
    name = 'AddInvoices1793201194374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" character varying(20) NOT NULL, "year" integer NOT NULL, "sequence" integer NOT NULL, "reservationId" uuid NOT NULL, "issuedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "customerName" character varying NOT NULL, "customerEmail" character varying NOT NULL, "customerAddress" character varying NOT NULL, "customerPostalCode" character varying(10) NOT NULL, "customerCity" character varying NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "lines" jsonb NOT NULL, "vatRateBps" integer NOT NULL, "totalHtCents" integer NOT NULL, "vatCents" integer NOT NULL, "totalTtcCents" integer NOT NULL, "paymentReference" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dc9c6a4d521286fd1acb6677879" UNIQUE ("reservationId"), CONSTRAINT "REL_dc9c6a4d521286fd1acb667787" UNIQUE ("reservationId"), CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id")); COMMENT ON COLUMN "invoice"."vatRateBps" IS 'Taux de TVA en points de base : 2000 = 20 %.'; COMMENT ON COLUMN "invoice"."paymentReference" IS 'Référence du paiement Stripe, pour le rapprochement.'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_60284980bc8b9c624459948f4a" ON "invoice" ("number") `);
        await queryRunner.query(`CREATE TABLE "invoice_counter" ("year" integer NOT NULL, "last" integer NOT NULL, CONSTRAINT "PK_f862d7351e59be2438f0e0e292a" PRIMARY KEY ("year"))`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_dc9c6a4d521286fd1acb6677879" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_dc9c6a4d521286fd1acb6677879"`);
        await queryRunner.query(`DROP TABLE "invoice_counter"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60284980bc8b9c624459948f4a"`);
        await queryRunner.query(`DROP TABLE "invoice"`);
    }

}
