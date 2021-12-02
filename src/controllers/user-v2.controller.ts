import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken, POST } from 'fastify-decorators';
import {
  getUserOwnerSchema,
  checkLineAccountJobSchema,
  addUserLineOASchema,
  checkLineAccountJobSchema2, bookingSchema2
} from './user.schema';
import Utility from 'utility-layer/dist/security'
import UserService from '../services/user.service';

export interface PostBookingLine {
  jobId: string
  truckId?: string
  requesterType: "JOB_OWNER" | "TRUCK_OWNER" | null
  accepterUserId: string
  requesterUserId: string
  phoneNumber: string
  fullName: string
  lineId: string
}

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

  @GET({
    url: '/check-line-oa',
    options: {
      schema: checkLineAccountJobSchema
    }
  })
  async checkLineAccount(req: FastifyRequest<{ Querystring: { lineId: string, jobId: string, saveHistory?: boolean } }>, reply: FastifyReply): Promise<object> {
    try {
      const { lineId, jobId, saveHistory } = req.query;
      const result = await this.userService.checkLineId(lineId, jobId, saveHistory);
      return {
        isCall: result
      }
    } catch (err: any) {
      throw new Error(err)
    }
  }

  @GET({
    url: '/check-line-oa-v2',
    options: {
      schema: checkLineAccountJobSchema2
    }
  })
  async checkLineAccountV2(req: FastifyRequest<{ Querystring: { lineId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { lineId } = req.query;
      const result = await this.userService.checkLineIdBeforeBooking(lineId);
      return result
    } catch (err: any) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/add-line-oa',
    options: {
      schema: addUserLineOASchema
    }
  })
  async addUserLineOA(req: FastifyRequest<{
    Body: {
      lineId: string,
      jobId: string,
      fullName: string,
      phoneNumber: string
    }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const result = await this.userService.updateOrCreateUserUsingLineId(req.body);
      return {
        isCall: result
      }
    } catch (err: any) {
      throw new Error(err)
    }
  }
  @POST({
    url: '/add-line-oa-v2',
    options: {
      schema: bookingSchema2
    }
  })
  async addLineOAWhenBookingLine(req: FastifyRequest<{ Body: PostBookingLine }>, reply: FastifyReply): Promise<Object> {
    try {
      console.log("Add line OA when booking params :: ", req.body)
      const result = await this.userService.updateOrCreateUserUsingLineIdV2(req.body);
      return result
    } catch (err: any) {
      throw new Error(err)
    }
  }
}
