import { DataSource } from 'typeorm'

export default new DataSource({
  type: 'postgres',
  host: 'db',
  port: 5432,
  username: 'postgres', //process.env.POSTGRES_USER
  password: 'postgres',
  database: 'snowwild',
  synchronize: true, //en dev, en prod on préfera utiliser les migrations
  logging: true,
  entities: ['src/entities/*.ts'],
})
