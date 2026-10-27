import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaintenance1793105110258 implements MigrationInterface {
    name = 'AddMaintenance1793105110258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "reason" character varying(200) NOT NULL, "expectedReturnDate" date, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "endedAt" TIMESTAMP WITH TIME ZONE, "variantId" uuid NOT NULL, CONSTRAINT "CHK_1e8b3d12b0f690b26963beddf0" CHECK ("quantity" > 0), CONSTRAINT "PK_542fb6a28537140d2df95faa52a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e6d46ecfa1df5ab655eebaead" ON "maintenance" ("variantId", "endedAt") `);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_a48d82780a8ce63f8dc303e10b5" FOREIGN KEY ("variantId") REFERENCES "material_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_a48d82780a8ce63f8dc303e10b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e6d46ecfa1df5ab655eebaead"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
    }

}
