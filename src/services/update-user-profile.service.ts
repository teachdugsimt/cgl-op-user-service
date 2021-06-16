import axios from 'axios';
import { Service, Initializer, Destructor } from 'fastify-decorators';

@Service()
export default class UpdateUserProfileService {
  @Initializer()
  async init(): Promise<void> { }

  async confirmMedia(url: string[]): Promise<any> {
    try {
      const result = await axios.post(`https://${process.env.API_GW_ID || '2kgrbiwfnc'}${process.env.API_URL || '.execute-api.ap-southeast-1.amazonaws.com'}/prod/api/v1/media/confirm`, {
        url
      })
      return result?.data
    } catch (error) {
      throw error
    }
  }

  @Destructor()
  async destroy(): Promise<void> { }
}
