import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, getInstanceByToken, POST } from 'fastify-decorators';
import AuthenticationService from '../services/authentication.service';
import { loginSchema, otpRequestSchema, otpVerifySchema, refreshTokenSchema } from './authentication.schema';
import Utility from 'utility-layer/dist/security'
import OtpRepository from "../repositories/otp.dynamodb.repository";
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import ValidateParam from '../services/validate-param.service'
import UserRoleService from '../services/user-role.service'
import TermOfServiceUserService from '../services/term-of-service-user.service'
import UserService from '../services/user.service';

const otpRepository = new OtpRepository();
const userDynamoRepository = new UserDynamodbRepository();
const utility = new Utility();

interface OtpRequestParams {
  countryCode: string,
  phoneNumber: string,
  userType: number
}

enum UserStatus {
  ACTIVE = 'ACTIVE'
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
      const username = countryCode.trim() + phoneNumber.trim();
      const userInformation = await userDynamoRepository.findByUsernameWithPhoneNumber(username);
      console.log('userInformation :>> ', userInformation);

      if (!userInformation) {
        // Create user
        const params = {
          phoneNumber: username,
          createdAt: new Date(),
          createdBy: 'mobile',
        }
        await this.userService.createNormalUser(params);
      } else {
        const userIsActive = await this.userService.checkUserActive(username);
        if (!userIsActive) {
          return reply.status(403).send({ error: 'InActiveException', message: 'User is inactivated' });
        }
      }

      const otpCode = utility.generateOtpCode(4);
      const refCode = utility.generateRefCode(6);
      const variant = refCode + username + otpCode;
      const variantSecurity = utility.generateOtpSecretCode(variant)

      const smsMessage = `${refCode} - The verifcation code is ${otpCode}`;

      await this.authenService.sendSMS(username, smsMessage);
      await otpRepository.create(variantSecurity, 90);

      return {
        refCode: refCode,
        // otp: otpCode,
      }

    } catch (err) {
      console.log('err :>> ', err);
      throw {
        statusCode: err?.statusCode || 400,
        code: err?.code || 'NotFoundException',
        message: err?.message || 'User not found'
      }
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
        const userInformation = await userDynamoRepository.findByUsernameWithPhoneNumber(username);
        console.log('userInformation :>> ', userInformation);
        if (userInformation) {
          const userProfile = await this.authenService.getUserProfile({ phoneNumber: username });
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
        const userProfile = await this.authenService.getUserProfile({ email, status: UserStatus.ACTIVE });
        if (!userProfile || !userProfile.id) {
          throw {
            statusCode: 403,
            code: 'InActiveException',
            message: 'User is inactivated'
          }
        }
        const termOfService = this.termOfServiceUserService.getTermOfServiceByUser(+userProfile.id)
        // const password: any = await utility.decryptByKms(userInformation.password)
        const token = await this.authenService.signin(email, password);
        return {
          message: '',
          responseCode: 1,
          userProfile: userProfile,
          token: token,
          termOfService: await termOfService
        }
      }
      throw {
        statusCode: 400,
        code: 'NotAuthorizedException',
        message: 'Incorrect username or password.',
      }
    } catch (err) {
      if (err?.code === 'NotAuthorizedException') {
        throw {
          statusCode: 400,
          error: err.code,
          message: err?.message || 'Incorrect username or password.',
        }
      }
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
      return {
        idToken: tokens?.idToken,
        accessToken: tokens?.accessToken,
      };
    } catch (err) {
      throw new Error(err)
    }
  }

}

// aws cognito-idp admin-set-user-password \
//   --user-pool-id "ap-southeast-1_tfXXNZA76" \
//   --username "atillart1003@gmail.com" \
//   --password "111111111" \
//   --permanent


/*
OTP_TABLE: 'cgl_otp'
USER_TABLE: 'cgl_user'
USER_POOL_ID: 'ap-southeast-1_hIWBSYz7z'
CLIENT_ID: '4qkd14u6na0fo1tfhtrdari41i'
MASTER_KEY_ID: 'arn:aws:kms:ap-southeast-1:029707422715:key/d0c2e90d-21f9-46bd-aa24-33e17f5d1b32'
PINPOINT_PROJECT_ID: '6218ffc1d1a9404b91858993b3cafed6'
MESSAGING_URL: 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/messaging'
*/
