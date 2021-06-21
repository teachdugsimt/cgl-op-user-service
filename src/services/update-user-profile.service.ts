import axios from 'axios';
import { Service, Initializer, Destructor } from 'fastify-decorators';

@Service()
export default class UpdateUserProfileService {
  @Initializer()
  async init(): Promise<void> { }

  async confirmMedia(url: string[]): Promise<any> {
    try {
      const apiUrl = process.env.API_URL ? process.env.API_URL + `/api/v1/media/confirm`
        : `https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/media/confirm`
      const result = await axios.post(apiUrl, {
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
