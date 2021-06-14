import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, GET, getInstanceByToken, PATCH, POST } from 'fastify-decorators';
import {
  getUserSchema,
  termOfServiceSchema,
  getUserOwnerSchema,
  updateUserOwnerSchema,
  getUserByUserIdSchema,
  updateUserByUserIdSchema,
  addUserSchema,
  deleteUserByUserIdSchema
} from './user.schema';
import ValidateParam from '../services/validate-param.service'
import TermOfServiceUserService from '../services/term-of-service-user.service'
import UserProfileRepository from '../repositories/user-profile.repository';
import UserDynamoRepository from '../repositories/user.dynamodb.repository'
import { FindManyOptions, FindOperator, Like } from 'typeorm';
import UtillityService from '../services/util.service';
import BuildResponse from 'utility-layer/dist/build-response'
import UserService from '../services/user.service';


interface UserFilterCondition {
  fullname?: FindOperator<string>
  email?: FindOperator<string>
  phoneNumber?: FindOperator<string>
}

const userProfileRepository = new UserProfileRepository();
const userDynamoRepository = new UserDynamoRepository();
const buildResponse = new BuildResponse()
const util = new UtillityService();

@Controller({ route: '/api/v1/users' })
export default class UserController {

  private userService = getInstanceByToken<UserService>(UserService);
  private termOfServiceUserService = getInstanceByToken<TermOfServiceUserService>(TermOfServiceUserService);

  // @ValidateParam(termOfServiceSchema)
  @POST({
    url: '/:userId/term-of-service',
    options: {
      schema: termOfServiceSchema
    }
  })
  async AcceptTermOfService(req: FastifyRequest<{ Body: { accept: boolean, version: string }, Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { accept, version } = req.body
      if (accept) {
        const userId: string = req.params.userId
        return await this.termOfServiceUserService.acceptTermOrService(userId, version);
      }
      return {}
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(addUserSchema)
  @POST({
    url: '/',
    options: {
      schema: addUserSchema
    }
  })
  async AddUser(req: FastifyRequest<{ Headers: { authorization: string }, Body: { name: string, phoneNumber: string, email?: string, userType?: number } }>, reply: FastifyReply): Promise<object> {
    try {
      const { name, phoneNumber, email, userType } = req.body

      const token = req.headers.authorization
      const data = {
        fullname: name,
        phoneNumber: phoneNumber,
        email: email,
        userType: userType,
        createdAt: new Date(),
        createdBy: util.getUserIdByToken(token),
        confirmationToken: util.generateRefCode(64)
      }

      return await this.userService.createNormalUser(data);
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(getUserSchema)
  @GET({
    url: '/',
    options: {
      schema: getUserSchema,
    }
  })
  async GetUsers(req: FastifyRequest<{ Querystring: { descending?: boolean, limit?: number, page?: number, name?: string, phoneNumber?: string, email?: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { descending, page = 0, limit = 20, name, phoneNumber, email } = req.query
      let cond: UserFilterCondition = {}

      if (name) cond.fullname = Like(`%${name}%`)
      if (email) cond.email = Like(`%${email}%`)
      if (phoneNumber) cond.phoneNumber = Like(`%${phoneNumber}%`)

      const filter: FindManyOptions = {
        where: cond,
        take: limit,
        skip: page,
        order: {
          id: descending ? 'DESC' : 'ASC'
        }
      }
      const users = await userProfileRepository.find(filter)
      return {
        message: '',
        responseCode: 1,
        data: users
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(getUserOwnerSchema)
  @GET({
    url: '/me',
    options: {
      schema: getUserOwnerSchema
    }
  })
  async GetUsersOwner(req: FastifyRequest<{ Querystring: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { userId } = req.query
      const id = util.decodeUserId(userId);
      const user = await userProfileRepository.findOne(id);
      return user
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(updateUserOwnerSchema)
  @PATCH({
    url: '/me',
    options: {
      schema: updateUserOwnerSchema
    }
  })
  async UpdateUsersOwner(req: FastifyRequest<{ Headers: { authorization: string }, Body: { userId: string, name?: string, phoneNumber?: string, email?: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { userId, name, phoneNumber, email } = req.body
      const id = util.decodeUserId(userId);
      const token = req.headers.authorization;
      const data = {
        fullname: name,
        phoneNumber: phoneNumber,
        email: email,
        updatedAt: new Date(),
        updatedBy: util.getUserIdByToken(token),
      }
      const user = await userProfileRepository.update(id, data);
      // console.log('user :>> ', user);
      return user
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(getUserByUserIdSchema)
  @GET({
    url: '/:userId',
    options: {
      schema: getUserByUserIdSchema
    }
  })
  async GetUserByUserId(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { userId } = req.params
      const id = util.decodeUserId(userId);
      const user = await userProfileRepository.findOne(id);
      // console.log('user :>> ', user);
      return user
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(updateUserByUserIdSchema)
  @PATCH({
    url: '/:userId',
    options: {
      schema: updateUserByUserIdSchema
    }
  })
  async UpdateUserByUserId(req: FastifyRequest<{ Params: { userId: string }, Body: { name?: string, phoneNumber?: string, email?: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { name, phoneNumber, email } = req.body
      const id = util.decodeUserId(req.params.userId);
      const data = {
        fullname: name,
        phoneNumber: phoneNumber,
        email: email,
        updatedAt: new Date(),
      }
      const user = await userProfileRepository.update(id, data);
      // console.log('user :>> ', user);
      return user
    } catch (err) {
      throw new Error(err)
    }
  }

  // @ValidateParam(deleteUserByUserIdSchema)
  @DELETE({
    url: '/:userId',
    options: {
      schema: deleteUserByUserIdSchema
    }
  })
  async DeleteUserByUserId(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const id = util.decodeUserId(req.params.userId);
      const userData = await userProfileRepository.findOne(id);
      await userDynamoRepository.delete(userData.phoneNumber);
      return await userProfileRepository.delete(id);
    } catch (err) {
      throw new Error(err)
    }
  }

}
