import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'
import datasource from '../db'
import Material from '../entities/material.entity'
import Reservation from '../entities/reservation.entity'
import {
  FindReservationMaterialsBetweenTwoDateInput,
  ReservationMaterial,
  UpdateReservationMaterialInput,
} from './../entities/reservation_material.entity'
import MaterialService from './material.service'
import ReservationService from './reservation.service'

export default class ReservationMaterialService {
  db: Repository<ReservationMaterial>
  constructor() {
    this.db = datasource.getRepository(ReservationMaterial)
  }

  async listReservationsMaterial() {
    return this.db.find()
  }

  async find(id: string) {
    const reservationMaterial = await this.db.findOne({
      where: { id },
      relations: { reservation: true },
    })

    return reservationMaterial
  }

  async findAllReservationMaterialBetweenUserDate(
    data: FindReservationMaterialsBetweenTwoDateInput
  ) {
    const { materialId, from_date, to_date } = data
    const materialData: Material = await new MaterialService().findMaterialById(
      materialId
    )
    if (!materialData) {
      throw new Error('Materiel inconnu')
    }
    const reservationMaterials = await this.db.find({
      where: {
        material: { id: materialId },
        reservation: {
          start_date: LessThanOrEqual(to_date),
          end_date: MoreThanOrEqual(from_date),
        },
      },
      relations: ['reservation'],
    })
    return reservationMaterials
  }

  async findReservationMaterial(id: string) {
    const reservationMaterial = await this.db.findOne({
      where: { id },
      relations: { material: true, reservation: true },
    })
    if (!reservationMaterial) {
      throw new Error("Le reservation material n'existe pas!!!!!!!!!")
    }

    return reservationMaterial
  }

  async createResMat(data: {
    reservation: Reservation
    quantity: number
    material: { id: string }
    size: string // Ajoutez le champ size
  }) {
    const { material, quantity, size } = data
    const materialData: Material | null =
      await new MaterialService().findMaterialById(material.id)
    if (!materialData) {
      throw new Error('Matériel non disponible')
    }

    const sizeData = materialData.sizes.find((s) => s.size === size)
    console.log(sizeData)

    if (!sizeData) {
      await new ReservationService().deleteReservation(data.reservation.id)
      throw new Error('Taille non disponible')
    }

    if (sizeData.quantity < data.quantity) {
      throw new Error('Matériel non disponible en quantité suffisante.')
    }

    // TODO: diminuer ou augmenter le nombre de matériel en base en fonction des départs et des retours
    // const newQuantity = materialData.quantity - data.quantity;
    // await new MaterialService().updateMaterial(materialData.id, {
    //   quantity: newQuantity,
    // });
    const final_price = materialData.price * quantity

    const newReservationMaterial = this.db.create({
      ...data,
      price: final_price,
      size: data.size,
    })

    const reservationmaterial = await this.db.save(newReservationMaterial)

    return await this.findReservationMaterial(reservationmaterial.id)
  }

  async updateResMat(
    id: string,
    data: Omit<UpdateReservationMaterialInput, 'id'>
  ) {
    const reservatioMaterialToUpdate = await this.findReservationMaterial(id)
    const { materialId, quantity } = data

    if (!materialId) return null
    const materialData = await new MaterialService().findMaterialById(
      materialId
    )
    if (!materialData || !quantity) return null
    const newPrice = materialData && quantity && materialData?.price * quantity

    if (!reservatioMaterialToUpdate) {
      throw new Error("La réservationMat n'existe pas !")
    }
    const reservationMaterialToSave = this.db.merge(
      reservatioMaterialToUpdate,
      { ...data, price: newPrice }
    )

    const reservationmaterial = await this.db.save(reservationMaterialToSave)

    return await this.findReservationMaterial(reservationmaterial.id)
  }

  async deleteReservationMaterial(id: string) {
    const reservationMaterialToDelete = (await this.find(
      id
    )) as ReservationMaterial
    await this.db.remove(reservationMaterialToDelete)
    return { ...reservationMaterialToDelete }
  }
}
