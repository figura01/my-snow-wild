import * as argon2 from 'argon2'
import Cookies from 'cookies'
import { SignJWT } from 'jose'
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { MyContext } from '../'
import User, {
  InputAdminCreateUser,
  InputAdminUpdateUser,
  InputLogin,
  InputRegister,
  Message,
  UpdateUserWithoutPassword,
  UserWithoutPassword,
} from '../entities/user.entity'
import UserService from '../services/user.service'

@Resolver()
export default class UserResolver {
  @Query(() => [User])
  async users() {
    return await new UserService().listUser()
  }

  @Query(() => UserWithoutPassword)
  async login(@Arg('infos') infos: InputLogin, @Ctx() ctx: MyContext) {
    const user = await new UserService().findUserByEmail(infos.email)
    if (!user) {
      throw new Error('Vérifiez vos informations')
    }

    const isPasswordValid = await argon2.verify(user.password, infos.password)
    if (isPasswordValid) {
      const token = await new SignJWT({
        email: user.email,
        role: user.role,
        userId: user.id,
      })
        .setProtectedHeader({
          alg: 'HS256',
          typ: 'jwt',
        })
        .setExpirationTime('2h')
        .sign(new TextEncoder().encode(`${process.env.JWT_SECRET_KEY}`))
      const cookies = new Cookies(ctx.req, ctx.res)
      cookies.set('token', token, { httpOnly: true })
    } else {
      throw Error('Vérifiez vos informations')
    }

    return user
  }

  @Query(() => Message)
  async logout(@Ctx() ctx: MyContext) {
    if (ctx.user) {
      const cookies = new Cookies(ctx.req, ctx.res)
      cookies.set('token') //sans valeur, le cookie token sera supprimé
    }
    const m = new Message()
    m.message = 'Vous avez été déconnecté'
    m.success = true

    return m
  }

  @Query(() => User)
  async getUserById(@Arg('id') id: string) {
    const user = await new UserService().findUserById(id)
    if (!user) {
      throw new Error('Pas de user avec cet Id')
    }
    return user
  }

  @Mutation(() => UserWithoutPassword)
  async register(@Arg('infos') infos: InputRegister) {
    const user = await new UserService().findUserByEmail(infos.email)
    if (user) {
      throw new Error('Cet email est déjà pris!')
    }
    const hashPassword = await argon2.hash(infos.password)
    if (hashPassword) {
      infos.password = hashPassword
    }

    const newUser = await new UserService().createUser(infos)
    return newUser
  }

  @Mutation(() => UpdateUserWithoutPassword)
  async updateUser(
    @Arg('infos') infos: InputAdminUpdateUser,
    @Arg('id') id: string
  ) {
    const user = await new UserService().findUserByEmail(infos.email)
    if (user) {
      throw new Error('Cet email est déjà pris!')
    }
    const hashPassword = await argon2.hash(infos.password)
    if (hashPassword) {
      infos.password = hashPassword
    }

    const newUser = await new UserService().updateUser(infos, id)
    return newUser
  }

  @Mutation(() => User)
  async deleteAdminUser(@Arg('id') id: string) {
    const deletedUser = await new UserService().adminDeleteUser(id)
    return deletedUser
  }

  @Mutation(() => UpdateUserWithoutPassword)
  async adminCreateUser(@Arg('infos') infos: InputAdminCreateUser) {
    const user = await new UserService().findUserByEmail(infos.email)
    if (user) {
      throw new Error('Cet email est déjà pris!')
    }
    const hashPassword = await argon2.hash(infos.password)
    if (hashPassword) {
      infos.password = hashPassword
    }

    const newUser = await new UserService().createAdminUser(infos)
    return newUser
  }
}
