import { Service, Initializer, Destructor } from 'fastify-decorators';
import TermOfServiceRepository from '../repositories/term-of-service.repository'

@Service()
export default class TermOfServiceUserService {

  private termOfServiceRepository = new TermOfServiceRepository()

  @Initializer()
  async init(): Promise<void> {
  }

  async getTermOfServicePartnerLastVersion(): Promise<any> {
    const termOfServiceLastVersion = await this.termOfServiceRepository.find({
      where: {
        type: 'PARTNER'
      },
      order: {
        versionNumber: 'DESC'
      },
      take: 1,
      skip: 0
    });

    return termOfServiceLastVersion[0]
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
