import { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordReset1793207000000 implements MigrationInterface {
    name = 'PasswordReset1793207000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordResetTokenHash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "passwordResetExpiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_bc0194243f004a9add2258d2d3" ON "user" ("passwordResetTokenHash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_bc0194243f004a9add2258d2d3"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordResetExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "passwordResetTokenHash"`);
    }

}
