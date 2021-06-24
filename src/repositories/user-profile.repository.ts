import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { UserProfile } from '../models';
import { FindManyOptions, FindOneOptions, ObjectLiteral, Repository } from 'typeorm';
import { UserProfileCreateEntity } from "./repository.types";

export default class UserProfileRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: UserProfileCreateEntity): Promise<any> {
    const server: any = this.instance
    const userProfileRepository = server?.db?.userProfile;
    return userProfileRepository.save(data);
  }

  async findOne(id: number, options?: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const userProfileRepository = server?.db?.userProfile;
    return userProfileRepository.findOne(id, options);
  }

  async findOneByAttribute(attribute: UserProfileCreateEntity, options?: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const userProfileRepository: Repository<UserProfile> = server?.db?.userProfile;
    return userProfileRepository.findOne(attribute, options);
  }

  async update(id: number, data: UserProfileCreateEntity): Promise<any> {
    const server: any = this.instance
    const userProfileRepository = server?.db?.userProfile;
    let userToUpdate = await userProfileRepository.findOne(id);
    userToUpdate = { ...userToUpdate, ...data };
    return userProfileRepository.save(userToUpdate);
  }

  async find(filter: FindManyOptions): Promise<any> {
    const server: any = this.instance
    const userProfileRepository: Repository<UserProfile> = server?.db?.userProfile;
    return userProfileRepository.find(filter);
  }

  async findAndCount(filter: FindManyOptions): Promise<any> {
    const server: any = this.instance
    const userProfileRepository: Repository<UserProfile> = server?.db?.userProfile;
    return userProfileRepository.findAndCount(filter);
  }

  async delete(id: number): Promise<any> {
    const server: any = this.instance;
    const userProfileRepository = server?.db?.userProfile;
    return userProfileRepository.delete(id);
  }

}
