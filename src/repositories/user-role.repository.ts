import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { UserRole } from '../models';
import { FindManyOptions, Repository } from 'typeorm';
import { UserRoleCreateEntity } from "./repository.types";

export default class UserRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: UserRoleCreateEntity): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<UserRole> = server?.db?.userRole;
    return userRepository.save(data);
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<UserRole> = server?.db?.userRole;
    return userRepository.find(options);
  }

}
