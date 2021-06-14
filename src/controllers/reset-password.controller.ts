import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, DELETE, GET, getInstanceByToken, PATCH, POST } from 'fastify-decorators';
import {
  resetConfirm,
  resetRequest
} from './reset-password.schema';
import UserProfileRepository from '../repositories/user-profile.repository';
import UserDynamoRepository from '../repositories/user.dynamodb.repository'
import UtillityService from '../services/util.service';
import BuildResponse from 'utility-layer/dist/build-response'
import UserService from '../services/user.service';
import UserResetPasswordDynamoRepository from '../repositories/user-reset-password.dynamodb.repository'
import axios from 'axios';

const userProfileRepository = new UserProfileRepository();
const userDynamoRepository = new UserDynamoRepository();
const userResetPassDynamoRepository = new UserResetPasswordDynamoRepository();
const buildResponse = new BuildResponse();
const util = new UtillityService();

@Controller({ route: '/api/v1/password' })
export default class ResetPasswordController {

  private userService = getInstanceByToken<UserService>(UserService);

  @GET({
    url: '/validate-token',
    options: {
      schema: resetRequest
    }
  })
  async ValidateToken(req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const userInfo = await userResetPassDynamoRepository.findByToken(req.query.token);
      if (userInfo) {
        if (userInfo.expire > Math.floor(Date.now() / 1000)) {
          return {
            statusCode: 200,
            message: 'REQUEST_SUCCESS'
          }
        }
        return {
          statusCode: 400,
          message: 'TOKEN_EXPIRED'
        }
      }
      return {
        statusCode: 400,
        message: 'TOKEN_DOES_NOT_EXIST'
      }
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

  @POST({
    url: '/reset-request',
    options: {
      schema: resetRequest
    }
  })
  async ResetRequest(req: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const email = req.body.email;
      const userDynamo = await userDynamoRepository.findByUsername(email);
      if (userDynamo) {
        const userProfile = await userProfileRepository.findOneByAttribute({ email: email }, { select: ['id'] });
        const userId = userProfile.id;
        const userResetPassInfo = await userResetPassDynamoRepository.findById(userId);
        const token = util.generateRefCode(32);
        if (userResetPassInfo) {
          if (userResetPassInfo.expire > Math.floor(Date.now() / 1000)) {
            // UPDATE TOKEN
            await userResetPassDynamoRepository.update({
              id: userId,
              token: token,
              expire: Math.floor(Date.now() / 1000)
            });

            return {
              statusCode: 200,
              message: 'REQUEST_SUCCESS',
              alreadySent: true
            }
          }
          return {
            statusCode: 400,
            message: 'REQUEST_FAILURE',
            alreadySent: false
          }
        }

        // const userProfile = await userProfileRepository.findOneByAttribute({ email: email }, { select: ['id'] });
        await userResetPassDynamoRepository.create({
          id: userId,
          token: token,
          expire: Math.floor(Date.now() / 1000)
        })

        return {
          statusCode: 200,
          message: 'REQUEST_SUCCESS',
          alreadySent: true
        }
      }
      return {
        statusCode: 400,
        message: 'REQUEST_FAILURE',
        alreadySent: false
      }
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

  @POST({
    url: '/reset',
    options: {
      schema: resetConfirm
    }
  })
  async ResetConfirm(req: FastifyRequest<{ Body: { token: string, password: string, confirmPassword: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { token, password, confirmPassword } = req.body;
      if (password === confirmPassword) {
        const userInfo = await userResetPassDynamoRepository.findByToken(token);
        if (userInfo) {
          if (userInfo.expire > Math.floor(Date.now() / 1000)) {
            // RESET PASSWORD
            const userProfile = await userProfileRepository.findOne(userInfo.id, { select: ['email'] });
            await this.userService.resetPassword(userProfile.email, password);
            return {
              statusCode: 200,
              message: 'REQUEST_SUCCESS'
            }
          }
          return {
            statusCode: 400,
            message: 'TOKEN_EXPIRED'
          }
        }
        return {
          statusCode: 400,
          message: 'TOKEN_DOES_NOT_EXIST'
        }
      }
      return {
        statusCode: 400,
        message: 'PASSWORD_DO_NOT_MATCH',
      }
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

}
