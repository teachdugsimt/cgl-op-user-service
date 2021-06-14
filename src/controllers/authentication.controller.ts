import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken, POST } from 'fastify-decorators';
import AuthenticationService from '../services/authentication.service';
import { loginSchema, otpRequestSchema, otpVerifySchema, refreshTokenSchema } from './authentication.schema';
import Utillity from '../services/util.service'
import SmsService from '../services/sms.service'
import OtpRepository from "../repositories/otp.dynamodb.repository";
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import ValidateParam from '../services/validate-param.service'
import UserRoleService from '../services/user-role.service'
import TermOfServiceUserService from '../services/term-of-service-user.service'
import UserService from '../services/user.service';

const otpRepository = new OtpRepository();
const userDynamoRepository = new UserDynamodbRepository();
const utillity = new Utillity();
const smsService = new SmsService();

interface OtpRequestParams {
  countryCode: string,
  phoneNumber: string,
  userType: number
}

@Controller({ route: '/api/v1/auth' })
export default class AuthenticationController {

  private authenService = getInstanceByToken<AuthenticationService>(AuthenticationService);
  private userRoleService = getInstanceByToken<UserRoleService>(UserRoleService);
  private termOfServiceUserService = getInstanceByToken<TermOfServiceUserService>(TermOfServiceUserService);
  private userService = getInstanceByToken<UserService>(UserService);

  @ValidateParam(otpRequestSchema)
  @POST({
    url: '/otp-request',
    options: {
      schema: otpRequestSchema
    }
  })
  async OtpRequest(req: FastifyRequest<{ Body: { countryCode: string, phoneNumber: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { phoneNumber, countryCode } = req.body
      // if (body && body?.countryCode && body?.phoneNumber) {
      const username = countryCode.trim() + phoneNumber.trim();
      const userInformation = await userDynamoRepository.findByUsername(username);
      // const userInfoByMobileNo = await userDynamoRepository.findByMobeilNo(username);

      // if (!userInformation || !userInfoByMobileNo) {
      if (!userInformation) {
        // Create user
        const params = {
          phoneNumber: username,
          createdAt: new Date(),
          createdBy: 'mobile',
        }
        await this.userService.createNormalUser(params);
      }

      const otpCode = utillity.generateOtpCode(4);
      const refCode = utillity.generateRefCode(6);
      const variant = refCode + username + otpCode;
      const variantSecurity = utillity.generateOtpSecretCode(variant)

      const smsMessage = `${refCode} - The verifcation code is ${otpCode}`;
      const result = await smsService.sendSms(username, smsMessage);
      console.log('result :>> ', JSON.stringify(result));

      await otpRepository.create(variantSecurity, 90);

      return {
        refCode: refCode,
        // otp: otpCode,
      }

    } catch (err) {
      console.log('err :>> ', err);
      return {}
    }
  }

  @ValidateParam(otpVerifySchema)
  @POST({
    url: '/otp-verify',
    options: {
      schema: otpVerifySchema
    }
  })
  async OtpVerify(req: FastifyRequest<{ Body: { countryCode: string, variant: string, phoneNumber: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { countryCode, phoneNumber, variant } = req.body
      const verifyOtp = await otpRepository.findByVariant(variant);
      console.log('verifyOtp :>> ', verifyOtp);
      if (verifyOtp && verifyOtp.expire > Math.floor(Date.now() / 1000)) {
        const username = countryCode.trim() + phoneNumber.trim();
        const userInformation = await userDynamoRepository.findByUsername(username);
        console.log('userInformation :>> ', userInformation);
        if (userInformation) {
          const userProfile = await this.authenService.getUserProfile(username);
          const termOfService = this.termOfServiceUserService.getTermOfServiceByUser(userProfile.id)
          const password: any = await utillity.decryptByKms(userInformation.password)
          console.log('password :>> ', password);
          const token = await this.authenService.signin(username, password);
          return {
            message: '',
            responseCode: 1,
            userProfile: userProfile,
            token: token,
            termOfService: termOfService
          }
        }
        throw new Error('Invalid Phone Number')
      }
      return {
        responseCode: '200',
        message: 'OTP is invalid or expire'
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @ValidateParam(loginSchema)
  @POST({
    url: '/login',
    options: {
      schema: loginSchema
    }
  })
  async Login(req: FastifyRequest<{ Body: { email: string, password: string }, Params: { userId: string } }>, reply: FastifyReply): Promise<object> {
    try {
      const { email, password } = req.body
      const userInformation = await userDynamoRepository.findByUsername(email);
      console.log('userInformation :>> ', userInformation);
      if (userInformation) {
        const userProfile = await this.authenService.getUserProfile(email);
        const termOfService = this.termOfServiceUserService.getTermOfServiceByUser(userProfile.id)
        // const password: any = await utillity.decryptByKms(userInformation.password)
        const token = await this.authenService.signin(email, password);
        return {
          message: '',
          responseCode: 1,
          userProfile: userProfile,
          token: token,
          termOfService: termOfService
        }
      }
      return {
        message: 'Invalid username or password',
        responseCode: 0,
        userProfile: {},
        token: {},
        termOfService: {}
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  @ValidateParam(refreshTokenSchema)
  @POST({
    url: '/refresh-token',
    options: {
      schema: refreshTokenSchema
    }
  })
  async RefreshToken(req: FastifyRequest<{ Body: { refreshToken: string, userId: string } }>, reply: FastifyReply): Promise<any> {
    try {
      const tokens = await this.authenService.refreshToken(req.body.refreshToken);
      console.log('tokens :>> ', tokens);
      return tokens;
    } catch (err) {
      throw new Error(err)
    }
  }

}
