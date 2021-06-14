import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { FindManyOptions } from 'typeorm';
import { TermOfServiceAddEntity } from "./repository.types";

export default class TermOfService {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: TermOfServiceAddEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository = server?.db?.termOfService;
    return termOfServiceRepository.save(data);
  }

  async findById(id: number): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository = server?.db?.termOfService;
    return termOfServiceRepository.findOne(id);
  }

  async findByVersion(version: String): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository = server?.db?.termOfService;
    return termOfServiceRepository.findOne({ versionNumber: version });
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository = server?.db?.termOfService;
    return termOfServiceRepository.find(options);
  }

}
