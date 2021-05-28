import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken, POST } from 'fastify-decorators';
import AuthenticationService from '../services/authentication.service';
import { otpRequestSchema, otpVerifySchema, refreshTokenSchema } from './authentication.schema';
import Utillity from '../services/util.service'
import SmsService from '../services/sms.service'
import OtpRepository from "../repositories/otp.dynamodb.repository";
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import ValidateParam from '../services/validate-param.service'

const otpRepository = new OtpRepository();
const userDynamoRepository = new UserDynamodbRepository();
const utillity = new Utillity();
const smsService = new SmsService();

interface OtpRequestParams {
  countryCode: string,
  phoneNumber: string,
  userType: number
}

@Controller({ route: '/api/v1/users' })
export default class AuthenticationController {

  private authenService = getInstanceByToken<AuthenticationService>(AuthenticationService);

  @ValidateParam(otpRequestSchema)
  @POST({
    url: '/auth/otp-request',
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
        const password = this.authenService.generatePassword(12);
        await this.authenService.createUser(username, password);
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
    url: '/auth/otp-verify',
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
          const password: any = await utillity.decryptByKms(userInformation.password)
          console.log('password :>> ', password);
          return await this.authenService.signin(username, password);
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

  @ValidateParam(refreshTokenSchema)
  @POST({
    url: '/auth/refresh-token',
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
