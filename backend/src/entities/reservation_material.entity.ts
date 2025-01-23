import { Field, Float, ID, InputType, ObjectType } from 'type-graphql'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import Material from './material.entity'
import Reservation from './reservation.entity'

// =================================================================
//                           OBJECT TYPE
// =================================================================
@ObjectType()
@Entity()
export class ReservationMaterial {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field()
  @Column()
  quantity: number

  @Field(() => Reservation)
  @JoinColumn()
  @ManyToOne(() => Reservation, (reservation) => reservation.id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  reservation: Reservation

  @Field(() => Material)
  @JoinColumn()
  @ManyToOne(() => Material, (material) => material.id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  material: Material

  @Field(() => Float)
  @Column({ type: 'float' })
  price: number // mettre en float

  @Field()
  @Column()
  size: string

  //avoir le prix ici (prix de CE material pour CETTE réservation)
}

// =================================================================
//                           INPUT TYPE
// =================================================================
@InputType()
export class CreateReservationMaterialInput {
  @Field(() => Reservation)
  reservation: Reservation // Identifiant de la réservation

  @Field(() => Material)
  material: Material // Identifiant du matériau

  @Field()
  quantity: number // Quantité de matériel réservé

  @Field()
  size: string // Taille de matériel réservé
}

@InputType()
export class UpdateReservationMaterialInput {
  @Field(() => ID)
  id: string

  @Field()
  materialId?: string // Identifiant du matériau

  @Field()
  quantity?: number // Quantité de matériel réservé
}

@InputType()
export class FindReservationMaterialsBetweenTwoDateInput {
  @Field()
  materialId: string

  @Field()
  from_date: Date

  @Field()
  to_date: Date
}
