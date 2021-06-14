import { Service, Initializer, Destructor } from 'fastify-decorators';
import UserRoleRepository from '../repositories/user-role.repository'

const ROLE_USER = 8

const userRoleRepository = new UserRoleRepository();

@Service()
export default class UserRoleService {
  @Initializer()
  async init(): Promise<void> {
  }

  async addRoleToUser(userId: number, roleId?: number): Promise<any> {
    if (!roleId) {
      roleId = ROLE_USER // INITIAL_ROLE
    }
    return userRoleRepository.add({ userId: userId, roleId: roleId });
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
