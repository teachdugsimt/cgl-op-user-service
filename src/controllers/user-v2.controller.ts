import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken } from 'fastify-decorators';
import {
  getUserOwnerSchema,
} from './user.schema';
import Utility from 'utility-layer/dist/security'
import UserService from '../services/user.service';

const util = new Utility();
@Controller({ route: '/api/v2/users' })
export default class UserV2Controller {

  private userService = getInstanceByToken<UserService>(UserService);

  @GET({
    url: '/me',
    options: {
      schema: getUserOwnerSchema
    }
  })
  async GetUsersOwner(req: FastifyRequest<{ Headers: { authorization: string }, Querystring: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const userId = req.query.userId;
      const userIdFromToken = util.getUserIdByToken(req.headers.authorization);
      if (userId !== userIdFromToken) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User id does not match' });
      }
      return await this.userService.getProfileByUserId(userId);
    } catch (err: any) {
      throw new Error(err)
    }
  }


}
