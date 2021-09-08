import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { TermOfServiceUser } from '../models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { TermOfServiceUserAddEntity, TermOfServiceFindEntity } from "./repository.types";

export default class TermOfServiceUserRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: TermOfServiceUserAddEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository: Repository<TermOfServiceUser> = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.save(data);
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository: Repository<TermOfServiceUser> = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.find(options);
  }

  async findOneWithOptions(options: TermOfServiceFindEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository: Repository<TermOfServiceUser> = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.findOne(options);
  }


}
