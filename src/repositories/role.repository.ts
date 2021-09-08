import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { Role } from '../models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UserRoleCreateEntity } from "./repository.types";

export default class RoleRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: Role): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<Role> = server?.db?.role;
    return userRepository.save(data);
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<Role> = server?.db?.role;
    return userRepository.find(options);
  }

  async findOne(options: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<Role> = server?.db?.role;
    return userRepository.findOne(options);
  }

}
