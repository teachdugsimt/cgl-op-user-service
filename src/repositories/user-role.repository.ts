import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { UserRoleCreateEntity } from "./repository.types";

export default class UserRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: UserRoleCreateEntity): Promise<any> {
    const server: any = this.instance
    const userRepository = server?.db?.userRole;
    return userRepository.save(data);
  }

}
