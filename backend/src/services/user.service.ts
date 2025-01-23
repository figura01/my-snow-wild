import User, {
  InputAdminCreateUser,
  InputAdminUpdateUser,
  InputRegister,
} from '../entities/user.entity'
import { Repository } from 'typeorm'
import datasource from '../db'

export default class UserService {
  db: Repository<User>
  constructor() {
    this.db = datasource.getRepository(User)
  }
  async findUser(id: string) {
    const user = await this.db.findOneBy({ id })
    if (!user) {
      throw new Error("Ce matériel n'existe pas")
    }
    return user
  }

  async listUser() {
    return this.db.find()
  }

  async findUserByEmail(email: string) {
    return await this.db.findOneBy({ email })
  }

  async findUserById(id: string) {
    return await this.db.findOne({
      where: { id },
      relations: {
        reservations: true,
      },
    })
  }

  async createUser({
    email,
    password,
    lastName,
    firstName,
    phone,
  }: InputRegister) {
    const newUser = this.db.create({
      email,
      password,
      lastName,
      firstName,
      phone,
    })
    return await this.db.save(newUser)
  }

  async deleteUser(id: string) {
    const user = (await this.findUser(id)) as User
    await this.db.remove(user)
    return { ...user, id }
  }

  async updateUser(infos: InputAdminUpdateUser, id: string) {
    const userToUpdate = (await this.findUser(id)) as User
    const userToSave = this.db.merge(userToUpdate, {
      ...infos,
    })

    return await this.db.save(userToSave)
  }

  async createAdminUser(infos: InputAdminCreateUser) {
    const createdAdminUser = this.db.create(infos)
    console.log('createdAdminUser: ', createdAdminUser)
    return await this.db.save(createdAdminUser)
  }

  async adminDeleteUser(id: string) {
    const user = (await this.findUserById(id)) as User

    const deletedUser = await this.db.remove(user)
    return { ...deletedUser, id }
  }
}
