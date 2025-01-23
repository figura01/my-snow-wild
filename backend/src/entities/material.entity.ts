import { Field, Float, ID, InputType, ObjectType } from 'type-graphql'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import Category from './category.entity'
import { ReservationMaterial } from './reservation_material.entity'

// =================================================================
//                           OBJECT TYPE
// =================================================================
@ObjectType()
@Entity()
export default class Material {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field()
  @Column({ length: 50 })
  name: string

  @Field()
  @Column()
  picture: string

  @Field(() => Float, { nullable: false })
  @Column('decimal', { precision: 5, scale: 2 })
  price: number

  @Field()
  @Column()
  description: string

  @Field(() => [SizeQuantity])
  @Column('json')
  sizes: { size: string; quantity: number }[]

  @Field(() => Category)
  @ManyToOne(() => Category, (c) => c.material, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  category: Category

  @Field(() => [ReservationMaterial])
  @JoinColumn()
  @OneToMany(() => ReservationMaterial, (r) => r.material)
  reservationMaterials: ReservationMaterial[]
}

@ObjectType()
class SizeQuantity {
  @Field()
  size: string

  @Field()
  quantity: number
}

@InputType()
export class PartialCategoryInput {
  @Field(() => ID)
  id: string

  @Field()
  name?: string
}

@InputType()
export class CreateMaterialInput {
  @Field({ nullable: false })
  name: string

  @Field({ nullable: true })
  description: string

  @Field(() => Float, { nullable: false })
  price: number

  @Field()
  picture: string

  @Field(() => [SizeInput], { nullable: false })
  sizes: SizeInput[]

  @Field({ nullable: false })
  category: PartialCategoryInput
}

@InputType() // Définissez un InputType pour représenter chaque taille avec sa quantité
class SizeInput {
  @Field()
  size: string // Taille du matériel

  @Field()
  quantity: number // Quantité disponible pour cette taille
}

@InputType()
export class UpdateMaterialInput {
  @Field(() => ID)
  id: string

  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  description?: string

  @Field(() => Float, { nullable: true })
  quantity?: number

  @Field(() => Float, { nullable: true })
  price?: number

  @Field({ nullable: true })
  picture?: string

  @Field()
  category?: PartialCategoryInput

  @Field(() => [SizeInput], { nullable: false })
  sizes: { size: string; quantity: number }[]
}
