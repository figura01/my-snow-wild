import { Arg, Mutation, Query, Resolver } from 'type-graphql'
import ReservationMaterialService from '../services/reservation_material.service'
import {
  FindReservationMaterialsBetweenTwoDateInput,
  ReservationMaterial,
  UpdateReservationMaterialInput,
} from './../entities/reservation_material.entity'

@Resolver()
export default class ReservationMaterialResolver {
  @Query(() => [ReservationMaterial])
  async reservations() {
    return await new ReservationMaterialService().listReservationsMaterial()
  }

  @Query(() => [ReservationMaterial])
  async reservationMaterialBetweenDates(
    @Arg('data') data: FindReservationMaterialsBetweenTwoDateInput
  ) {
    return await new ReservationMaterialService().findAllReservationMaterialBetweenUserDate(
      data
    )
  }

  // Update reservationMaterial data : quantity or material
  @Mutation(() => ReservationMaterial)
  async updateReservationMaterial(
    @Arg('data') data: UpdateReservationMaterialInput
  ): Promise<ReservationMaterial> {
    const { id, ...otherData } = data

    const reservationMaterialToUpdate =
      await new ReservationMaterialService().updateResMat(id, otherData)

    if (!reservationMaterialToUpdate) {
      throw new Error("La reservationMat n'existe point")
    }

    return reservationMaterialToUpdate
  }

  // Create Query to get One Reaservation by ID

  // Create Query to get One Reaservation by ID user

  // Create Mutaion add one reseervation
}
