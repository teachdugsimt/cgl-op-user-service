import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, getInstanceByToken, POST } from 'fastify-decorators';
import AuthenticationService from '../services/authentication.service';
import { otpVerifySchema } from './authentication.schema';
import Utility from 'utility-layer/dist/security'
import OtpRepository from "../repositories/otp.dynamodb.repository";
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import ValidateParam from '../services/validate-param.service'
import TermOfServiceUserService from '../services/term-of-service-user.service'

const otpRepository = new OtpRepository();
const userDynamoRepository = new UserDynamodbRepository();
const utility = new Utility();

@Controller({ route: '/api/v2/auth' })
export default class AuthenticationV2Controller {

  private authenService = getInstanceByToken<AuthenticationService>(AuthenticationService);
  private termOfServiceUserService = getInstanceByToken<TermOfServiceUserService>(TermOfServiceUserService);

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
        const userInformation = await userDynamoRepository.findByUsernameWithPhoneNumber(username);
        console.log('userInformation :>> ', userInformation);
        if (userInformation) {
          const userProfile = await this.authenService.getUserProfile({ phoneNumber: username });
          console.log("User profile controller :: ", userProfile)
          const termOfService = this.termOfServiceUserService.getTermOfServiceByUser(+userProfile.id);
          const password: any = await utility.decryptByKms(userInformation.password)
          console.log('password :>> ', password);
          const myUsername = userInformation?.phoneNumber ? userInformation.username : username;
          console.log('myUsername :>> ', myUsername);
          const token = await this.authenService.signin(myUsername, password);
          return {
            message: '',
            responseCode: 1,
            userProfile: userProfile,
            token: token,
            termOfService: await termOfService
          }
        }
        throw new Error('Invalid Phone Number')
      }
      return {
        responseCode: '200',
        message: 'OTP is invalid or expire'
      }
    } catch (err: any) {
      throw new Error(err)
    }
  }

}
