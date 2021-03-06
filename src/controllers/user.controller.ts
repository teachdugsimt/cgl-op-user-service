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
  documentStatusSchema,
  userSummarySchema, userSummarySchemaWithoutAuthorize, termOfServicePartnerSchema, addTermOfServiceSchema,
  schemaDeleteUserDocumentById
} from './user.schema';
import TermOfServiceUserService from '../services/term-of-service-user.service'
import TermOfServiceService from '../services/term-of-service.service'
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
  private termOfServiceService = getInstanceByToken<TermOfServiceService>(TermOfServiceService);

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
    } catch (err: any) {
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
    Body: { fullName: string, phoneNumber: string, email?: string, userType?: 'SHIPPER' | 'CARRIER' | 'BOTH', legalType?: 'INDIVIDUAL' | 'JURISTIC', url?: string[] }
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
    } catch (err: any) {
      console.log('err :>> ', err);
      reply.status(400);
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
    } catch (err: any) {
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
      let result: any = await this.userService.getProfileByUserId(userId);
      delete result.userType
      delete result.document
      delete result.documentStatus
      delete result.legalType
      delete result.files
      delete result.attachCodeCitizenId
      delete result.roleName
      delete result.confirmationToken
      delete result.deviceToken
      delete result.enabled
      delete result.createdAt
      delete result.updatedAt
      delete result.createdBy
      delete result.updatedBy
      console.log("Result : ", result)
      return result
    } catch (err: any) {
      throw new Error(err)
    }
  }

  @PATCH({
    url: '/me',
    options: {
      schema: updateUserOwnerSchema
    }
  })
  async UpdateUsersOwner(req: FastifyRequest<{
    Headers: { authorization: string },
    Body: { userId: string, fullName?: string, phoneNumber?: string, email?: string, avatar?: string, userType?: 'SHIPPER' | 'CARRIER' | 'BOTH' }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const userId = req.body.userId
      const userIdFromToken = util.getUserIdByToken(req.headers.authorization);

      if (userId !== userIdFromToken) {
        return reply.status(401).send({ statusCode: 401, error: 'Unauthorized', message: 'User id does not match' });
      }

      return await this.userService.updateUserProfile(req.body);
    } catch (err: any) {
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
    } catch (err: any) {
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
    Body: { fullName?: string, phoneNumber?: string, email?: string, url?: string[], legalType?: 'INDIVIDUAL' | 'JURISTIC', avatar?: string }
  }>, reply: FastifyReply): Promise<object> {
    try {
      const params = {
        userId: req.params.userId,
        ...req.body
      }
      return await this.userService.updateUserProfile(params);
    } catch (err: any) {
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
    } catch (err: any) {
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
        const data = { userId: req.params.userId }
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
          // await repo.deleteUploadLink(decodeId)
          result = await repo.updateToken(uploadLinkObject)
        } else {
          result = await repo.createUploadLinkData(uploadLinkObject)
        }

        if (result && typeof result == "object")
          return { url: link, userId: req.params.userId }
        else return { url: null, userId: req.params.userId }
      }
    } catch (err: any) {
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
    } catch (err: any) {
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
          reply.status(401).send({ message: "Link was expired, please contact system administrator" })

        if (uploadTokenLink && uploadTokenLink.token != req.body.token) {
          reply.status(401).send({ message: "Link was expired, please contact system administrator" })
        }
        console.log("Step 1 : upload link data : ", uploadTokenLink)

        // 2. call media/confirm
        if (Array.isArray(req.body.url) == false) {
          reply.status(401).send({ message: "Invalid url format type" })
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
          reply.status(401).send({ message: "Invalid url entry" })
        }
      }
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.log('err :>> ', err);
      throw new Error(err)
    }
  }

  @GET({
    url: '/:userId/profile-trucks',
    options: {
      schema: userSummarySchema
    }
  })
  async getUserSummary(req: FastifyRequest<{ Params: { userId: string }, Headers: { authorization: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const userId = req.params.userId;
      const userIdFromToken = util.getUserIdByToken(req.headers.authorization);
      console.log("user Id : ", userId)
      console.log("Fromm token :: ", userIdFromToken)
      let result: any
      console.log("User ID decode :: ", util.decodeUserId(userId))
      if (userId !== userIdFromToken) {
        result = await this.userService.userAndTruckSummaryWithoutAuthorize(util.decodeUserId(userId), userId, req.headers.authorization);
      } else {
        result = await this.userService.userAndTruckSummary(util.decodeUserId(userId), req.headers.authorization);
      }
      return { ...result }
    } catch (err: any) {
      throw new Error(err)
    }
  }

  // @GET({
  //   url: '/:userId/profile-trucks-without-auth',
  //   options: {
  //     schema: userSummarySchemaWithoutAuthorize
  //   }
  // })
  // async getUserSummaryWithOutAuthorize(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
  //   try {
  //     const userId = req.params.userId;
  //     const parseUserId = util.decodeUserId(userId)
  //     console.log("Raw id :: ", userId)
  //     console.log("Parse id :: ", parseUserId)
  //     const result = await this.userService.userAndTruckSummaryWithoutAuthorize(util.decodeUserId(userId), parseUserId);
  //     return { ...result }
  //   } catch (err: any) {
  //     throw new Error(err)
  //   }
  // }

  @GET({
    url: '/:userId/term-of-service-partner',
    options: {
      schema: termOfServicePartnerSchema
    }
  })
  async getTermOfServicePartner(req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const userId = util.decodeUserId(req.params.userId)
      const userDoc = await this.userService.getDocumentStatus(userId);
      const message = this.userService.mappingMessageByDocumentStatus(userDoc);
      if (message) {
        return {
          message,
          version: '',
          accepted: true,
          data: ''
        }
      }
      const termOfService = await this.termOfServiceService.getTermOfServicePartnerLastVersion();
      return {
        message: '',
        version: termOfService.versionNumber,
        accepted: false,
        data: termOfService.data
      }
    } catch (err: any) {
      if (err.name === 'USER_DOES_NOT_EXISTS') {
        return reply.status(404).send({ message: 'User does not exists' })
      }
      throw new Error(err)
    }
  }

  @POST({
    url: '/:userId/term-of-service-partner',
    options: {
      schema: addTermOfServiceSchema
    }
  })
  async addTermOfServicePartner(req: FastifyRequest<{ Body: { accept: boolean, version: string }, Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { accept, version } = req.body
      if (accept) {
        const userId: string = req.params.userId
        return await this.termOfServiceUserService.acceptTermOrServicePartner(userId, version);
      }
      return {}
    } catch (err: any) {
      throw new Error(err)
    }
  }

  @DELETE({
    url: '/:userId/document',
    options: {
      schema: schemaDeleteUserDocumentById
    }
  })
  async deleteUserDocumentById(req: FastifyRequest<{ Params: { userId: string }, Querystring: { docId: string } }>, reply: FastifyReply): Promise<any> {
    try {
      if (req.params.userId && req.query.docId) {
        const decodeId = util.decodeUserId(req.params.userId)
        const result = await this.userService.deleteDocumentById(decodeId, req.query.docId)
        console.log("Result delete user document : ", result)
        return result
      } else reply.status(400).send({
        message: "bad request"
      })
    } catch (err: any) {
      throw new Error(err)
    }
  }

}
