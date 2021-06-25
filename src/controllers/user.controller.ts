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
    Body: { name: string, phoneNumber: string, email?: string, userType?: number, legalType?: 'INDIVIDUAL' | 'JURISTIC', attachCode?: string[] }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const { name, phoneNumber, email, userType, legalType = 'INDIVIDUAL', attachCode } = req.body

      const token = req.headers.authorization
      const data = {
        fullname: name,
        phoneNumber: phoneNumber,
        email: email,
        userType: userType,
        createdAt: new Date(),
        createdBy: util.getUserIdByToken(token),
        confirmationToken: util.generateRefCode(64),
        legalType: legalType,
        attachCode: attachCode
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
      sortBy?: 'id' | 'email' | 'fullname' | 'phoneNumber'
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

  // @ValidateParam(getUserOwnerSchema)
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

  // @ValidateParam(updateUserOwnerSchema)
  @PATCH({
    url: '/me',
    options: {
      schema: updateUserOwnerSchema
    }
  })
  async UpdateUsersOwner(req: FastifyRequest<{ Headers: { authorization: string }, Body: { userId: string, name?: string, phoneNumber?: string, email?: string } }>, reply: FastifyReply): Promise<object> {
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
      return await this.userService.getProfileByUserId(userId);
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
  async UpdateUserByUserId(req: FastifyRequest<{
    Params: { userId: string },
    Body: { name?: string, phoneNumber?: string, email?: string, attachCode?: string[], legalType?: 'INDIVIDUAL' | 'JURISTIC' }
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
      return reply.status(202);
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/:id/gen-doc-upload-link',
    options: {
      schema: generateUploadLinkResponse
    }
  })
  async GenerateLinkUpload(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.id) {
        const data = { userId: req.params.id }
        console.log("Data to jwt :: ", data)
        const base_url = process.env.WEB_BACKOFFICE ? `${process.env.WEB_BACKOFFICE}/user/upload?token=` : "https://dev.backoffice.cargolink.co.th/user/upload?token="
        const token = util.generateJwtToken(data)
        const link = base_url + token

        const repo = new UserDynamodbRepository()
        const everHaveToken: UploadLink = await repo.findAttachCodeWithUser(req.params.id)

        let result: any
        if (everHaveToken && typeof everHaveToken && Object.keys(everHaveToken).length > 0) {
          await repo.deleteUploadLink(req.params.id)
          const uploadLinkObject = {
            token,
            user_id: req.params.id
          }
          result = await repo.createUploadLinkData(uploadLinkObject)
        } else {
          const uploadLinkObject = {
            token,
            user_id: req.params.id
          }
          result = await repo.createUploadLinkData(uploadLinkObject)
        }

        if (result && typeof result == "object")
          return { url: link, userId: req.params.id }
        else return { url: null, userId: req.params.id }
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({
    url: '/:id/clear-upload-link',
    options: {
      schema: deleteUploadLinkResponse
    }
  })
  async ClearUploadLink(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.id) {
        const repo = new UserDynamodbRepository()
        const result = await repo.deleteUploadLink(req.params.id)

        if (result && typeof result == "object")
          return { data: true }
        else return { data: false }
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @POST({  // call media/confirm & /:id/clear-upload-link
    url: '/:id/update-user-profile',
    options: {
      schema: updateUserProfileResponse
    }
  })
  async updateUserProfile(req: FastifyRequest<{ Params: { id: string }, Body: { token: string, url: string[] } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.id) {

        //  1. Validate token(latest upload link) in cgl_user_upload_link 
        const repo = new UserDynamoRepository()
        const uploadTokenLink = await repo.findAttachCodeWithUser(req.params.id)
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
      return reply.status(204);
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
  async UpdateDocumentStatus(req: FastifyRequest<{ Params: { userId: string }, Body: { status: 'NO_DOCUMENT' | 'WAIT_FOR_VERIFIED' | 'VERIFIED' } }>, reply: FastifyReply): Promise<any> {
    try {
      await this.userService.updateUserDocumentStatus(req.params.userId, req.body.status);
      return reply.status(204);
    } catch (err) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

}
