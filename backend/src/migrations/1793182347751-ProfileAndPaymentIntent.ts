import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileAndPaymentIntent1793182347751 implements MigrationInterface {
    name = 'ProfileAndPaymentIntent1793182347751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "address" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "postalCode" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "city" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD "stripePaymentIntentId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "stripePaymentIntentId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "postalCode"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
    }

}
