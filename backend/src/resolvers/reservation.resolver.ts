/* eslint-disable @typescript-eslint/no-unused-vars */
import { Arg, Mutation, Query, Resolver } from 'type-graphql'

import { GraphQLDate } from 'graphql-scalars'
import Reservation, {
  AdminDeletedReservation,
  CreateReservationInput,
  ReservationDeleted,
  UpdateReservationInput,
} from '../entities/reservation.entity'
import { ReservationMaterial } from '../entities/reservation_material.entity'
import ReservationService from '../services/reservation.service'
import ReservationMaterialService from '../services/reservation_material.service'

@Resolver()
export default class ReservationResolver {
  @Query(() => [Reservation])
  async reservations() {
    return await new ReservationService().listReservations()
  }

  // Get One Reaservation by ID
  @Query(() => Reservation)
  async reservationById(@Arg('id') id: string) {
    const reservation = await new ReservationService().findReservationById(id)
    return reservation
  }

  // Get All Reservation by ID user
  @Query(() => [Reservation])
  async reservationsByUserId(@Arg('id') id: string) {
    const reservation = await new ReservationService().findReservationsByUserId(
      id
    )
    return reservation
  }

  // Get All reservation(s) by date
  @Query(() => [Reservation])
  async reservationsByDate(@Arg('date', () => GraphQLDate) date: Date) {
    const reservation = await new ReservationService().findReservationsByDate(
      date
    )

    return reservation
  }

  // Create Mutaion add one reservation
  @Mutation(() => Reservation) //prévoir un object type de retour
  async createReservation(
    @Arg('data') data: CreateReservationInput
  ): Promise<Reservation> {
    const newReservation = await new ReservationService().createReservation(
      data
    )

    const materialsPromises = data.materials.map((material) => {
      const dataToResMat = {
        reservation: newReservation, //  {id: ...}
        quantity: material.quantity,
        material: { id: material.materialId },
        size: material.size,
      }

      return new ReservationMaterialService().createResMat(dataToResMat)
    })

    const reservationMaterials = (await Promise.all(
      materialsPromises
    )) as ReservationMaterial[]

    newReservation.reservationMaterials = reservationMaterials
    return newReservation
  }

  // Update Reservation start_date or end_date
  @Mutation(() => Reservation)
  async updateReservation(
    @Arg('data') data: UpdateReservationInput
  ): Promise<Reservation> {
    const { id, ...otherData } = data
    const reservationToUpdate =
      await new ReservationService().updateReservation(id, otherData)

    if (!reservationToUpdate) {
      throw new Error("La reservation n'existe pas")
    }

    return reservationToUpdate
  }

  // Delete ReservationById
  @Mutation(() => ReservationDeleted)
  async deleteReservation(@Arg('id') id: string) {
    const { id: idReservation, ...reservation } =
      await new ReservationService().deleteReservation(id)

    return { ...reservation }
  }

  @Mutation(() => AdminDeletedReservation)
  async adminDeleteReservation(@Arg('id') id: string) {
    const { id: idReservation, ...reservation } =
      await new ReservationService().deleteReservation(id)

    return { ...reservation }
  }

  @Query(() => [Reservation])
  async adminGetReservations() {
    return await new ReservationService().listReservations()
  }
}
