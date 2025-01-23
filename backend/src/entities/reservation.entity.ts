import { Field, ID, InputType, ObjectType } from 'type-graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ReservationMaterial } from './reservation_material.entity'
import User from './user.entity'
import { StatutReservation } from '../types'

// =================================================================
//                           OBJECT TYPE
// =================================================================

@ObjectType()
@Entity()
export default class Reservation {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field(() => User)
  @JoinColumn()
  @ManyToOne(() => User, (u) => u.reservations, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User

  @Field()
  @Column()
  start_date: Date

  @Field()
  @Column()
  end_date: Date

  @Field()
  @CreateDateColumn({
    type: 'date',
  })
  createdAt: Date

  @Field()
  @Column({
    type: 'enum',
    enum: StatutReservation,
    default: StatutReservation.AWAITING,
  })
  status: StatutReservation

  @Field(() => [ReservationMaterial])
  @JoinColumn()
  @OneToMany(() => ReservationMaterial, (r) => r.reservation)
  reservationMaterials: ReservationMaterial[]
}

// Quand on fait un ObjectType à supprimer, ne pas mettre d'id. Il sera supprimé, donc pas de retour.
@ObjectType()
export class ReservationDeleted {
  @Field(() => User)
  user: User

  @Field(() => [ReservationMaterial])
  reservationMaterials: ReservationMaterial[] // Liste des matériels réservés avec leur quantité

  @Field()
  status: StatutReservation.CANCEL
}

// =================================================================
//                           INPUT TYPE
// =================================================================

@InputType()
export class ReservationMaterialInput {
  @Field()
  quantity: number

  @Field()
  materialId: string

  @Field()
  size: string
}

@InputType()
export class PartialUserInput {
  @Field(() => ID)
  id: string
}

@InputType()
export class CreateReservationInput {
  @Field()
  user: PartialUserInput // Identifiant de l'utilisateur qui effectue la réservation

  @Field(() => [ReservationMaterialInput])
  materials: ReservationMaterialInput[] // Liste des matériels réservés avec leur quantité

  @Field()
  start_date: Date

  @Field()
  end_date: Date
}

@InputType()
export class UpdateReservationInput {
  @Field(() => ID)
  id: string

  @Field({ nullable: true })
  start_date?: Date

  @Field({ nullable: true })
  end_date?: Date
}

@ObjectType()
export class AdminDeletedReservation {
  @Field(() => User)
  user: User

  @Field(() => [ReservationMaterial])
  reservationMaterials: ReservationMaterial[] // Liste des matériels réservés avec leur quantité

  @Field()
  status: StatutReservation.CANCEL

  @Field()
  start_date: Date

  @Field()
  end_date: Date

  @Field()
  createdAt: Date
}

@ObjectType()
export class AdminGetReservations {
  @Field(() => User)
  user: User

  @Field(() => [ReservationMaterial])
  reservationMaterials: ReservationMaterial[] // Liste des matériels réservés avec leur quantité

  @Field()
  status: StatutReservation.CANCEL

  @Field()
  start_date?: Date

  @Field()
  end_date?: Date

  @Field()
  createdAt?: Date
}
