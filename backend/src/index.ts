import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import datasource from './db'
import MaterialResolver from './resolvers/material.resolver'
import ReservationResolver from './resolvers/reservation.resolver'
import UserResolver from './resolvers/user.resolver'
import Cookies from 'cookies'
import UserService from './services/user.service'
import PaymentResolver from './resolvers/payment.resolver'

import cors from 'cors'
import express from 'express'
import http from 'http'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import User from './entities/user.entity'
import CategoryResolver from './resolvers/category.resolver'

import ReservationMaterialResolver from './resolvers/reservation_material.resolver'

import { jwtVerify } from 'jose'
import { customAuthChecker } from './lib/authChecker'

export interface MyContext {
  req: express.Request
  res: express.Response
  user?: User | null
}

export interface Payload {
  email: string
  role: string
  userId: string
}

const app = express()
const httpServer = http.createServer(app)

async function main() {
  const schema = await buildSchema({
    resolvers: [
      CategoryResolver,
      MaterialResolver,
      UserResolver,
      ReservationResolver,
      ReservationMaterialResolver,
      PaymentResolver,
    ],
    validate: false,
    authChecker: customAuthChecker,
  })

  const server = new ApolloServer<MyContext>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()
  app.use(
    '/',
    cors<cors.CorsRequest>({
      origin: ['http://localhost:3000', 'http://localhost:4000', 'localhost://8000'],
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        let user: User | null = null
        const cookies = new Cookies(req, res)
        const token = cookies.get('token')
        if (token) {
          try {
            const verify = await jwtVerify<Payload>(
              token,
              new TextEncoder().encode(process.env.JWT_SECRET_KEY)
            )
            user = await new UserService().findUserByEmail(verify.payload.email)
          } catch (err) {
            console.log(err)
          }
        }
        return { req, res, user }
      },
    })
  )
  await datasource.initialize()
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  )
  console.log(`🚀 Server lancé sur http://localhost:4000/`)
}

main()
