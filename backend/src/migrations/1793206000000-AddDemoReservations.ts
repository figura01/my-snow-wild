import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDemoReservations1793206000000 implements MigrationInterface {
    name = 'AddDemoReservations1793206000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" ADD "demo" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "demo"`);
    }

}
