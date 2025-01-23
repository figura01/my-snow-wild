import { DataSource } from 'typeorm'

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  //   Dans notre cas, il faut mettre le localhost comme host car on est hors de l'environnement Docker.
  port: 5432,
  username: 'postgres', //process.env.POSTGRES_USER
  password: 'postgres',
  database: 'snowwild',
  synchronize: true, //en dev, en prod on préfera utiliser les migrations
  logging: false,
  entities: ['src/entities/*.ts'],
})
