import { Repository } from 'typeorm'
import datasource from '../db'
import Reservation, {
  CreateReservationInput,
  UpdateReservationInput,
} from '../entities/reservation.entity'
import { StatutReservation } from '../types'
export default class ReservationService {
  db: Repository<Reservation>
  constructor() {
    this.db = datasource.getRepository(Reservation)
  }

  async listReservations() {
    return this.db.find({
      relations: {
        user: true,
        reservationMaterials: {
          material: true,
        },
      },
    })
  }

  async findReservationById(id: string) {
    const reservation = await this.db.findOne({
      where: { id },
      relations: { reservationMaterials: true },
    })
    return reservation
  }

  async findReservationsByUserId(id: string) {
    const reservationByUserId = await this.db.find({
      where: { user: { id } },
      relations: [
        'user',
        'reservationMaterials',
        'reservationMaterials.material',
      ],
    })

    return reservationByUserId
  }

  async findReservationsByDate(date: Date) {
    const reservationsByDate = await this.db.find({
      where: {
        createdAt: date,
      },
    })

    return reservationsByDate
  }

  async createReservation(data: CreateReservationInput) {
    const { ...otherData } = data
    const createdAt = new Date()

    const dataIntermediaire = {
      ...otherData,
      createdAt,
      statut: StatutReservation.AWAITING,
    }
    const newReservation = this.db.create({ ...dataIntermediaire })

    const creatResa = await this.db.save(newReservation)

    return creatResa
  }

  async updateReservation(
    id: string,
    data: Omit<UpdateReservationInput, 'id'>
  ) {
    const reservationToUpdate = await this.findReservationById(id)
    if (!reservationToUpdate) {
      throw new Error("La réservation n'existe pas !")
    }
    const { start_date, end_date } = data

    const reservationToSave = this.db.merge(reservationToUpdate, {
      start_date,
      end_date,
    })
    await this.db.save(reservationToSave)
    return await this.findReservationById(reservationToSave.id)
  }

  async deleteReservation(id: string) {
    const reservationToDelete = (await this.findReservationById(
      id
    )) as Reservation

    await this.db.remove(reservationToDelete)
    return { ...reservationToDelete, id }
  }
}
