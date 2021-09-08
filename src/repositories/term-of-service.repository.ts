import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { TermOfService } from '../models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { TermOfServiceAddEntity } from "./repository.types";

export default class TermOfServiceRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async add(data: TermOfServiceAddEntity): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository: Repository<TermOfService> = server?.db?.termOfService;
    return termOfServiceRepository.save(data);
  }

  async findById(id: number): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository: Repository<TermOfService> = server?.db?.termOfService;
    return termOfServiceRepository.findOne(id);
  }

  async findByVersion(version: string): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository: Repository<TermOfService> = server?.db?.termOfService;
    return termOfServiceRepository.findOne({ versionNumber: version });
  }

  async find(options: FindManyOptions): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository: Repository<TermOfService> = server?.db?.termOfService;
    return termOfServiceRepository.find(options);
  }

  async findOne(options: FindOneOptions): Promise<any> {
    const server: any = this.instance;
    const termOfServiceRepository: Repository<TermOfService> = server?.db?.termOfService;
    return termOfServiceRepository.findOne(options);
  }

}
