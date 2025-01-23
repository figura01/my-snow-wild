import { ApolloServer } from '@apollo/server'
import { buildSchemaSync } from 'type-graphql'
import CategoryResolver from '../../src/resolvers/category.resolver'

import { addMocksToSchema } from '@graphql-tools/mock'
import assert from 'assert'
import Category from '../../src/entities/category.entity'

import {
  FIND_CATEGORY_BY_ID,
  LIST_CATEGORY,
  LIST_CATEGORY_WITH_NAME,
} from '../requete_tests/queries_tests/category.queries'

import type { CategoryNameResponseData, ResponseData } from '../type_tests'

const id1 = '1';
const id2 = '2';
const categoryData: Category[] = [
  { id: id1, name: 'Categorie 1', material: [] },
  { id: id2, name: 'Catégorie 2', material: [] },
]

let server: ApolloServer

const baseSchema = buildSchemaSync({
  resolvers: [CategoryResolver],
  authChecker: () => true,
})

beforeAll(async () => {
  const resolvers = () => ({
    Query: {
      categories() {
        return categoryData
      },
      findCategory(_: unknown, args: { id: string }) {
        return categoryData.find((b) => b.id == args.id)
      },
    },
  })
  server = new ApolloServer({
    schema: addMocksToSchema({
      schema: baseSchema,
      resolvers: resolvers as unknown as ReturnType<typeof resolvers>,
    }),
  })
})

describe('Test sur les categories', () => {
  it('mon premier test', async () => {
    const response = await server.executeOperation<ResponseData>({
      query: LIST_CATEGORY,
    })

    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data?.categories).toHaveLength(2)
  })


  it("récupération des categories uniquement avec leurs nom", async () => {
    const response = await server.executeOperation<ResponseData>({
      query: LIST_CATEGORY_WITH_NAME,
    })

    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data).toEqual({
      categories: [{ name: 'Categorie 1' }, { name: 'Catégorie 2' }],
    })
  })


  it("récupération d'une catégorie avec son nom", async () => {
    const response = await server.executeOperation<CategoryNameResponseData>({
      query: FIND_CATEGORY_BY_ID,
      variables: {
        findCategoryId: id1,
      },
    })
    assert(response.body.kind === 'single')
    expect(response.body.singleResult.data).toEqual({
      findCategory: {
        id: categoryData[0].id,
        name: categoryData[0].name,
      }
    })
  })
})
