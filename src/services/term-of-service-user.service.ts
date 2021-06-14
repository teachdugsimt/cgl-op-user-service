import { Service, Initializer, Destructor, getInstanceByToken } from 'fastify-decorators';
import TermOfServiceUserRepository from '../repositories/term-of-service-user.repository'
import TermOfServiceRepository from '../repositories/term-of-service.repository'
import UtillityService from './util.service'

// const termOfServiceRepository = new TermOfServiceRepository();
// const termOfServiceUserRepository = new TermOfServiceUserRepository();
// const util = new UtillityService();

@Service()
export default class TermOfServiceUserService {

  private termOfServiceRepository = new TermOfServiceRepository()
  private termOfServiceUserRepository = new TermOfServiceUserRepository();
  private util = new UtillityService();

  @Initializer()
  async init(): Promise<void> {
  }

  async getTermOfServiceByUser(userId: number): Promise<any> {
    const termOfServiceLastVersion = await this.termOfServiceRepository.find({
      order: {
        versionNumber: 'DESC'
      },
      skip: 1
    });

    const termOfService = termOfServiceLastVersion[0]

    const termOfServiceUser = await this.termOfServiceUserRepository.findOnWithOptions({
      termOfServiceId: termOfService.id,
      userId: userId,
    })

    return {
      version: termOfService.versionNumber,
      accepted: termOfServiceUser?.id ? true : false,
      acceptedAt: termOfServiceUser?.createdAt,
      data: termOfService.data
    }
  }

  async acceptTermOrService(userId: string, version: string): Promise<any> {
    const id = this.util.decodeUserId(userId);
    const termOfService = await this.termOfServiceRepository.findByVersion(version);
    if (termOfService?.id) {
      const dateNow = new Date();
      // const dateNow = new Date().toISOString();
      return this.termOfServiceUserRepository.add({
        termOfServiceId: termOfService.id,
        userId: id,
        version: termOfService.version,
        createdAt: dateNow,
        updatedAt: dateNow,
      })
    }
    return false
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
