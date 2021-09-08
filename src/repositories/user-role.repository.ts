import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { UserRole } from '../models';
import { FindManyOptions, Repository } from 'typeorm';
import { UserRoleCreateEntity } from "./repository.types";

export default class UserRoleRepository {

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

  async findRoleNames(userId: number): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<UserRole> = server?.db?.userRole;
    return userRepository.query(`SELECT
        r.fullname AS rolename
      FROM user_role ur
      INNER JOIN "role" r
        ON r.id = ur.role_id
      WHERE
        ur.user_id = $1`, [userId]);
  }

  async updateRoleId(userId: number, roleFrom: number, roleTo: number): Promise<any> {
    const server: any = this.instance
    const userRepository: Repository<UserRole> = server?.db?.userRole;
    return userRepository.query(`UPDATE user_role SET role_id = $1 WHERE user_id = $2 AND role_id = $3`, [roleTo, userId, roleFrom]);
  }

}
