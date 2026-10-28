import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Sépare le compte (user : e-mail de connexion, mot de passe, rôle) de la fiche client
 * (customer : identité et coordonnées). Écrite à la main : chaque compte existant reçoit
 * sa fiche (même identifiant, données recopiées) avant que user.customerId devienne obligatoire.
 * Noms de contraintes identiques à ceux que calcule TypeORM, pour que les prochaines
 * migrations générées ne voient aucune différence.
 */
export class AddCustomers1793205000000 implements MigrationInterface {
    name = 'AddCustomers1793205000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."customer_source_enum" AS ENUM('SIGNUP', 'IMPORT')`);
        await queryRunner.query(`CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying(20), "address" character varying(200), "postalCode" character varying(10), "city" character varying(100), "source" "public"."customer_source_enum" NOT NULL DEFAULT 'SIGNUP', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdb2f3ad8115da4c7718109a6e" ON "customer" ("email") `);

        // Reprise des données : une fiche par compte existant.
        await queryRunner.query(`ALTER TABLE "user" ADD "customerId" uuid`);
        await queryRunner.query(`INSERT INTO "customer" ("id", "firstName", "lastName", "email", "phone", "address", "postalCode", "city", "source", "createdAt", "updatedAt")
            SELECT "id", "firstName", "lastName", lower("email"), "phone", "address", "postalCode", "city", 'SIGNUP', "createdAt", "updatedAt" FROM "user"`);
        await queryRunner.query(`UPDATE "user" SET "customerId" = "id"`);

        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "customerId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "REL_6c687a8fa35b0ae35ce766b56c" UNIQUE ("customerId")`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_6c687a8fa35b0ae35ce766b56ce" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "postalCode"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "firstName" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "lastName" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "address" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "postalCode" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "city" character varying(100)`);
        await queryRunner.query(`UPDATE "user" u SET "firstName" = c."firstName", "lastName" = c."lastName", "phone" = c."phone",
            "address" = c."address", "postalCode" = c."postalCode", "city" = c."city" FROM "customer" c WHERE c."id" = u."customerId"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "firstName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "lastName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_6c687a8fa35b0ae35ce766b56ce"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "REL_6c687a8fa35b0ae35ce766b56c"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "customerId"`);
        // Les fiches importées (sans compte) sont perdues : elles n'existaient pas avant.
        await queryRunner.query(`DROP INDEX "public"."IDX_fdb2f3ad8115da4c7718109a6e"`);
        await queryRunner.query(`DROP TABLE "customer"`);
        await queryRunner.query(`DROP TYPE "public"."customer_source_enum"`);
    }

}
