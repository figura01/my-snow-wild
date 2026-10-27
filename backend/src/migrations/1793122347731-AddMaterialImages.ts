import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMaterialImages1793122347731 implements MigrationInterface {
    name = 'AddMaterialImages1793122347731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "material_image" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "storage" character varying(20) NOT NULL DEFAULT 'local', "key" character varying(200) NOT NULL, "alt" character varying(200) NOT NULL DEFAULT '', "position" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "materialId" uuid NOT NULL, CONSTRAINT "PK_6c85d9fe705e8813a941e7c0b7b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."material_level_enum" AS ENUM('ALL', 'BEGINNER', 'INTERMEDIATE', 'EXPERT')`);
        await queryRunner.query(`ALTER TABLE "material" ADD "level" "public"."material_level_enum"`);
        await queryRunner.query(`ALTER TABLE "material" ADD "features" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "material_image" ADD CONSTRAINT "FK_923af5f83edc4d70cf655dd8b05" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "material_image" DROP CONSTRAINT "FK_923af5f83edc4d70cf655dd8b05"`);
        await queryRunner.query(`ALTER TABLE "material" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "material" DROP COLUMN "level"`);
        await queryRunner.query(`DROP TYPE "public"."material_level_enum"`);
        await queryRunner.query(`DROP TABLE "material_image"`);
    }

}
