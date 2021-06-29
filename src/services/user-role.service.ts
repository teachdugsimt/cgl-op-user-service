import { Service, Initializer, Destructor } from 'fastify-decorators';
import { In } from 'typeorm';
import UserRoleRepository from '../repositories/user-role.repository'

enum Role {
  Admin = 1,
  CustomerService = 2,
  Driver = 3,
  Member = 4
}

const userRoleRepository = new UserRoleRepository();

@Service()
export default class UserRoleService {
  @Initializer()
  async init(): Promise<void> {
  }

  async addRoleToUser(userId: number, roleId?: number): Promise<any> {
    if (!roleId) {
      roleId = Role.Member // INITIAL_ROLE
    }
    return userRoleRepository.add({ userId: userId, roleId: roleId });
  }

  async isBackofficeUser(userId: number): Promise<any> {
    const userRoles = await userRoleRepository.find({
      where: {
        userId: userId,
        roleId: In([Role.Admin, Role.CustomerService])
      },
      take: 1
    });
    return userRoles?.length ? true : false
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
