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
  deleteUserByUserIdSchema,
  generateUploadLinkResponse,
  deleteUploadLinkResponse,
  updateUserProfileResponse,
  logoutSchema,
  userStatusSchema,
  documentStatusSchema
} from './user.schema';
import TermOfServiceUserService from '../services/term-of-service-user.service'
import UserProfileRepository from '../repositories/user-profile.repository';
import UserDynamoRepository from '../repositories/user.dynamodb.repository'
import Utility from 'utility-layer/dist/security'
import BuildResponse from 'utility-layer/dist/build-response'
import UserService from '../services/user.service';
import UpdateUserProfileService from '../services/update-user-profile.service'
import UserDynamodbRepository, { UploadLink } from '../repositories/user.dynamodb.repository';
import { userInfo } from 'os';
import ValidateEncodeIdFormat from '../services/validate-encode-id-format.service';

const userProfileRepository = new UserProfileRepository();
const userDynamoRepository = new UserDynamoRepository();
const buildResponse = new BuildResponse()
const util = new Utility();
@Controller({ route: '/api/v1/users' })
export default class UserController {

  private userService = getInstanceByToken<UserService>(UserService);
  private termOfServiceUserService = getInstanceByToken<TermOfServiceUserService>(TermOfServiceUserService);
  private updateUserProfileServ = getInstanceByToken<UpdateUserProfileService>(UpdateUserProfileService);

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
  async AddUser(req: FastifyRequest<{
    Headers: { authorization: string },
    Body: { fullName: string, phoneNumber: string, email?: string, userType?: number, legalType?: 'INDIVIDUAL' | 'JURISTIC', attachCode?: string[] }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const token = req.headers.authorization
      const userId = util.getUserIdByToken(token);
      const decodeUserId = util.decodeUserId(userId);

      const data = {
        ...req.body,
        legalType: req.body.legalType ?? 'INDIVIDUAL',
        createdAt: new Date(),
        createdBy: decodeUserId,
        confirmationToken: util.generateRefCode(64),
      }

      return await this.userService.createNormalUser(data);
    } catch (err) {
      console.log('err :>> ', err);
      throw err
    }
  }

  // @ValidateParam(getUserSchema)
  @GET({
    url: '/',
    options: {
      schema: getUserSchema,
    }
  })
  async GetUsers(req: FastifyRequest<{
    Querystring: {
      descending?: boolean,
      rowsPerPage?: number,
      page?: number,
      fullName?: string,
      phoneNumber?: string,
      email?: string,
      sortBy?: 'id' | 'email' | 'fullName' | 'phoneNumber'
    }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const { rowsPerPage = 10, page = 1 } = req.query
      const users = await this.userService.getAllUser(req.query);
      return {
        data: users.data,
        size: rowsPerPage,
        currentPage: page,
        totalPages: Math.ceil(users.count / (+rowsPerPage)),
        totalElements: users.count,
        numberOfElements: users.data.length ?? 0,
      }
    } catch (err) {
      throw new Error(err)
    }
  }

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
    } catch (err) {
      throw new Error(err)
    }
  }

  @PATCH({
    url: '/me',
    options: {
      schema: updateUserOwnerSchema
    }
  })
  async UpdateUsersOwner(req: FastifyRequest<{ Headers: { authorization: string }, Body: { userId: string, fullName?: string, phoneNumber?: string, email?: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const userId = req.body.userId
      const userIdFromToken = util.getUserIdByToken(req.headers.authorization);

      if (userId !== userIdFromToken) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User id does not match' });
      }

      return await this.userService.updateUserProfile(req.body);
    } catch (err) {
      throw new Error(err)
    }
  }

  @ValidateEncodeIdFormat()
  @GET({
    url: '/:userId',
    options: {
      schema: getUserByUserIdSchema
    }
  })
  async GetUserByUserId(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { userId } = req.params
      return await this.userService.getProfileByUserId(userId);
    } catch (err) {
      throw new Error(err)
    }
  }

  @ValidateEncodeIdFormat()
  @PATCH({
    url: '/:userId',
    options: {
      schema: updateUserByUserIdSchema
    }
  })
  async UpdateUserByUserId(req: FastifyRequest<{
    Params: { userId: string },
    Body: { fullName?: string, phoneNumber?: string, email?: string, attachCode?: string[], legalType?: 'INDIVIDUAL' | 'JURISTIC' }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const params = {
        userId: req.params.userId,
        ...req.body
      }
      return await this.userService.updateUserProfile(params);
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
      // const userData = await userProfileRepository.findOne(id);
      // await userDynamoRepository.delete(userData.phoneNumber);
      await userProfileRepository.update(id, { status: 'INACTIVE' });
      return reply.status(202).send();
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/:userId/gen-doc-upload-link',
    options: {
      schema: generateUploadLinkResponse
    }
  })
  async GenerateLinkUpload(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.userId) {

        const decodeId = util.decodeUserId(req.params.userId)
        const data = { userId: decodeId }
        console.log("Data to jwt :: ", data)

        const base_url = process.env.BACK_OFFICE_URL ? `${process.env.BACK_OFFICE_URL}/${process.env.USER_UPLOAD || 'user/upload/'}?token=` : "https://dev.backoffice.cargolink.co.th/user/upload?token="
        const token = util.generateJwtToken(data)
        const link = base_url + token

        const repo = new UserDynamodbRepository()
        const everHaveToken: UploadLink = await repo.findAttachCodeWithUser(decodeId)

        let result: any
        const uploadLinkObject = {
          token,
          user_id: decodeId
        }
        if (everHaveToken && typeof everHaveToken && Object.keys(everHaveToken).length > 0) {
          await repo.deleteUploadLink(decodeId)
          result = await repo.createUploadLinkData(uploadLinkObject)
        } else {
          result = await repo.createUploadLinkData(uploadLinkObject)
        }

        if (result && typeof result == "object")
          return { url: link, userId: req.params.userId }
        else return { url: null, userId: req.params.userId }
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/:userId/clear-upload-link',
    options: {
      schema: deleteUploadLinkResponse
    }
  })
  async ClearUploadLink(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.userId) {
        const decodeId = util.decodeUserId(req.params.userId)
        const repo = new UserDynamodbRepository()
        const result = await repo.deleteUploadLink(decodeId)

        if (result && typeof result == "object")
          return { data: true }
        else return { data: false }
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({  // call media/confirm & /:userId/clear-upload-link
    url: '/:userId/update-user-profile',
    options: {
      schema: updateUserProfileResponse
    }
  })
  async updateUserProfile(req: FastifyRequest<{ Params: { userId: string }, Body: { token: string, url: string[] } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.userId) {

        const decodeId = util.decodeUserId(req.params.userId)
        //  1. Validate token(latest upload link) in cgl_user_upload_link 
        const repo = new UserDynamoRepository()
        const uploadTokenLink = await repo.findAttachCodeWithUser(decodeId)
        if (!uploadTokenLink || (typeof uploadTokenLink == "object" && Object.keys(uploadTokenLink).length == 0))
          return { message: "Link was expired, please contact manager" }

        if (uploadTokenLink && uploadTokenLink.token != req.body.token) {
          return { message: "Link was expired, please contact manager" }
        }
        console.log("Step 1 : upload link data : ", uploadTokenLink)

        // 2. call media/confirm
        if (Array.isArray(req.body.url) == false) {
          return { message: "Invalid url format type" }
        }
        const confirmResult = await this.updateUserProfileServ.confirmMedia(req.body.url)

        console.log("Step 2 : confirm media : ", confirmResult)

        // 3. call id/clear-upload-link
        if (confirmResult && confirmResult?.message == "confirm success") {
          await this.userService.updateUserFile(decodeId, req.body.url)
          const controllerM = new UserController()
          const clearUploadLinkResult = await controllerM.ClearUploadLink(req, reply)
          console.log("Step 3 : clear upload link : ", clearUploadLinkResult)
          return { message: "Update success" }
        } else {
          return { message: "Invalid url entry" }
        }
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/logout',
    options: {
      schema: logoutSchema
    }
  })
  async Logout(req: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply): Promise<any> {
    try {
      return await this.userService.signOut(req.body.token);
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

  @PATCH({
    url: '/:userId/status',
    options: {
      schema: userStatusSchema
    }
  })
  async UpdateUserStatus(req: FastifyRequest<{ Params: { userId: string }, Body: { status: 'ACTIVE' | 'INACTIVE' } }>, reply: FastifyReply): Promise<any> {
    try {
      await this.userService.updateUserStatus(req.params.userId, req.body.status);
      return reply.status(204).send();
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

  @PATCH({
    url: '/:userId/doc-status',
    options: {
      schema: documentStatusSchema
    }
  })
  async UpdateDocumentStatus(req: FastifyRequest<{ Params: { userId: string }, Body: { status: 'NO_DOCUMENT' | 'WAIT_FOR_VERIFIED' | 'VERIFIED' | 'REJECTED' } }>, reply: FastifyReply): Promise<any> {
    try {
      await this.userService.updateUserDocumentStatus(req.params.userId, req.body.status);
      return reply.status(204).send();
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

}
