import { FastifyInstance } from 'fastify';
import { FastifyInstanceToken, getInstanceByToken } from 'fastify-decorators';
import { VwUserJobSummary } from '../models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';

export default class UserJobSummaryRepository {

  private instance: FastifyInstance = getInstanceByToken(FastifyInstanceToken);

  async findOne(id: number, options?: FindOneOptions): Promise<any> {
    const server: any = this.instance
    const vwUserSummary: any = server?.db?.vwUserSummary;
    return vwUserSummary.findOne({ where: [{ id }], ...options });
  }

  async find(filter: FindManyOptions): Promise<any> {
    const server: any = this.instance
    const vwUserSummary: Repository<VwUserJobSummary> = server?.db?.vwUserSummary;
    return vwUserSummary.find(filter);
  }


}
