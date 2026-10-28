import { Column, Entity, PrimaryColumn } from "typeorm";

// Dernier numéro de facture attribué, par année. Incrémenté dans la même transaction
// que la création de la facture : une annulation libère le numéro, il n'y a pas de trou.
@Entity()
export class InvoiceCounter {
  @PrimaryColumn({ type: "int" })
  year: number;

  @Column({ type: "int" })
  last: number;
}
