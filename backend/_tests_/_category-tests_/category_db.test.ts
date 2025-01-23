/* eslint-disable no-undef */
import { ApolloServer } from '@apollo/server'
import assert from 'assert'
import { buildSchemaSync } from 'type-graphql'
import { isUuid } from 'uuidv4'
import datasourceInitial from '../../src/db'
import datasourceTest from '../../src/db_test'
import Category from '../../src/entities/category.entity'
import CategoryResolver from '../../src/resolvers/category.resolver'
import {
  CREATE_CATEGORY,
  DELETE_CATEGORY,
} from '../requete_tests/mutations_tests/category.mutation'

import { LIST_CATEGORY } from '../requete_tests/queries_tests/category.queries'

import type {
  CreateResponseData,
  DeleteResponseData,
  ResponseData,
} from '../type_tests'

let server: ApolloServer

const baseSchema = buildSchemaSync({
  resolvers: [CategoryResolver],
  authChecker: () => true,
})

beforeAll(async () => {
  server = new ApolloServer({
    schema: baseSchema,
  })
  jest
    .spyOn(datasourceInitial, 'getRepository')
    .mockReturnValue(datasourceTest.getRepository(Category))
  await datasourceTest.initialize()
  //   await datasourceTest.getRepository(Category).clear();
})

// afterAll(async () => {
//   await datasourceTest.dropDatabase(); //suppression de la base de donnée
// });

describe('Affichage de la liste des catégories', () => {
  it('récupération de la liste des livres en base', async () => {
    //ici notre code de test
    const response = await server.executeOperation<ResponseData>({
      query: LIST_CATEGORY,
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data?.categories).toHaveLength(0)
  })

  it.only('création de catégorie puis suppression', async () => {
    const response = await server.executeOperation<CreateResponseData>({
      query: CREATE_CATEGORY,
      variables: {
        data: { name: 'Snowboard' },
      },
    })
    assert(response.body.kind === 'single')
    const id = response.body.singleResult.data?.createCategory.id
    const name = response.body.singleResult.data?.createCategory.name
    console.log('RESPONSE', JSON.stringify(response))

    expect(id).not.toBeNull() // je m'assure que l'id n'est pas null
    expect(isUuid(`${id}`)).toBeTruthy() // que c'est bien un uuid valide
    expect(response.body.singleResult.data?.createCategory.name).toEqual(
      'Snowboard'
    )

    // déportation de delete dans la creation pour accéder à l'id
    const deleteresponse = await server.executeOperation<DeleteResponseData>({
      query: DELETE_CATEGORY,
      variables: {
        deleteCategoryId: id,
      },
    })
    assert(deleteresponse.body.kind === 'single')
    console.log('DELETERESPONSE', JSON.stringify(deleteresponse))

    expect(deleteresponse.body.singleResult.data?.deleteCategory).toEqual({
      id: id,
      name: name,
    })
  })

  it('récupération de la liste des livres en base après ajout', async () => {
    //ici notre code de test
    const response = await server.executeOperation<ResponseData>({
      query: LIST_CATEGORY,
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data?.categories).toHaveLength(1)
  })
})
