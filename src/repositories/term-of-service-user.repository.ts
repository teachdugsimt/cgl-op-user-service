import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { TermOfServiceUserAddEntity, TermOfServiceFindEntity } from "./repository.types";

export default class TermOfServiceUser {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: TermOfServiceUserAddEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.save(data);
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.find(options);
  }

  async findOnWithOptions(options: TermOfServiceFindEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceUserRepository = server?.db?.termOfServiceUser;
    return termOfServiceUserRepository.findOne(options);
  }


}
