import type { Stripe } from 'stripe'
import { ProductForSessionInput } from '../resolvers/payment.resolver'
import datasource from '../db'
import Material from '../entities/material.entity'
import { Repository } from 'typeorm'

export default class PaymentService {
  private stripe: Stripe
  db: Repository<Material>

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.stripe = require('stripe')(process.env.STRIPE_PRIVATE_API_KEY!)
  }

  async calculateTotalAmount(data: ProductForSessionInput[]): Promise<number> {
    const productRepository = datasource.getRepository(Material)
    const totalAmount = await data.reduce(async (prevPromise, curr) => {
      const prev = await prevPromise
      const itemInMemory = await productRepository.findOneBy({ id: curr.id }) // Récupérer le produit depuis la base de données
      console.log('%c⧭', 'color: #006dcc', itemInMemory)
      if (!itemInMemory) {
        throw new Error("Ce produit n'existe pas")
      }
      const prix_hors_taxe = itemInMemory.price
      const taxes = prix_hors_taxe * 0.2 * curr.quantity
      const prixTTC = prix_hors_taxe * curr.quantity + taxes
      return prev + prixTTC
    }, Promise.resolve(0))
    return parseFloat(totalAmount.toFixed(2))
  }
  async createSession(data: ProductForSessionInput[]) {
    const totalAmount = (await this.calculateTotalAmount(data)) * 100
    const session = await this.stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
    })
    return session
  }
}
