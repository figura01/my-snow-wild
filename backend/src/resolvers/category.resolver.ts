import Category, {
  AdminUpdateCategoryInput,
} from './../entities/category.entity'
import { Arg, Mutation, Query, Resolver } from 'type-graphql'
import CategoryService from '../services/category.service'
import { CreateCategoryInput } from '../entities/category.entity'

@Resolver()
export default class CategoryResolver {
  @Query(() => [Category])
  async categories() {
    return await new CategoryService().listCategories()
  }

  @Query(() => Category)
  async findCategoryById(@Arg('id') id: string) {
    return await new CategoryService().findCategoryById(id)
  }

  @Query(() => Category)
  async findCategoryByName(@Arg('name') name: string) {
    return await new CategoryService().findCategoryByName(name)
  }

  @Mutation(() => Category)
  async createCategory(@Arg('data') data: CreateCategoryInput) {
    const findedCategory = await new CategoryService().findCategoryByName(
      data.name
    )
    console.log('findedCategory: ', findedCategory)
    if (findedCategory) {
      throw new Error('This name alredy used')
      // return findedCategory
    }
    const newCategory = await new CategoryService().createCategory({
      ...data,
    })
    return newCategory
  }

  @Mutation(() => Category)
  async updateCategory(@Arg('data') data: AdminUpdateCategoryInput) {
    const { id } = data

    const findedCategory = await new CategoryService().findCategoryById(id)
    console.log('findedCategory: ', findedCategory)
    // if(!findedCategory) {
    //   throw new Error("Error, This category id doesn't exist !")
    // }
    const updatedCategory = await new CategoryService().updateCategory(data)
    return updatedCategory
  }

  //   @Authorized(["admin"])
  @Mutation(() => Category)
  async deleteCategory(@Arg('id') id: string) {
    const categoryDeleted = await new CategoryService().deleteCategory(id)
    return categoryDeleted
  }
}
