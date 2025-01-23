import { Field, ID, InputType, ObjectType } from 'type-graphql'
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import Material from './material.entity'

@ObjectType()
@Entity()
export default class Category {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Field()
  @Column({ unique: true })
  name: string

  @Field(() => [Material])
  @JoinColumn()
  @OneToMany(() => Material, (m) => m.category)
  material: Material[]
}

@InputType()
export class CreateCategoryInput {
  @Field({ nullable: false })
  name: string
}

@InputType()
export class AdminUpdateCategoryInput {
  @Field({ nullable: false })
  id: string

  @Field({ nullable: false })
  name: string
}
@ObjectType()
export class AdminUpdateCategoryOutput {
  @Field({ nullable: false })
  id: string

  @Field({ nullable: false })
  name: string
}
