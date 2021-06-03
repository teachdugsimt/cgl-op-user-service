import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { FindOneOptions } from 'typeorm';
import connection from '../plugins'
import { UserDataCreateType } from "./repository.types";

export default class UserRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async create(data: UserDataCreateType): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.users;
    return userRepository.save(data);
  }

  async findOne(id: number, options?: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.users;
    return userRepository.findOne(id, options);
  }

  async findOneByAttribute(attribute: UserDataCreateType, options?: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.users;
    return userRepository.findOne(attribute, options);
  }

  async update(id: number, data: UserDataCreateType): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.users;
    let userToUpdate = await userRepository.findOne(id);
    userToUpdate = { ...userToUpdate, ...data };
    return userRepository.save(userToUpdate);
  }

  async find(filter: any): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.users;
    return userRepository.find(filter);
  }

}
