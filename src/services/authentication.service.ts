import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js'
import cryptoRandomString from 'crypto-random-string';
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import UserRepository from '../repositories/user-profile.repository'
import Utility from 'utility-layer/dist/security'
import axios from 'axios';

interface FilterUserProfile {
  phoneNumber?: string
  email?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

interface NewTokenGenerate {
  accessToken?: string
  expiresIn?: number
  tokenType?: string
  idToken?: string
}

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const userDynamoRepository = new UserDynamodbRepository();
const userRepository = new UserRepository();
const utility = new Utility();

const UserPoolId = process.env.USER_POOL_ID || '';
const AppClient = process.env.CLIENT_ID || '';

const getTokens = (tokens: any) => {
  return {
    idToken: tokens.getAccessToken().getJwtToken(),
    accessToken: tokens.getIdToken().getJwtToken(),
    refreshToken: tokens.getRefreshToken().getToken(),
  };
};

const getCognitoToUser = (username: string) => {
  const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: UserPoolId,
    ClientId: AppClient
  });
  const userData = {
    Username: username,
    Pool: userPool,
  };
  return new AmazonCognitoIdentity.CognitoUser(userData);
};

const signUp = async (username: string, password: string, userId: string): Promise<any> => {
  const params = {
    UserPoolId: UserPoolId,
    Username: username,
    TemporaryPassword: password,
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      {
        Name: 'custom:userId',
        Value: userId
      }
    ]
  };
  return cognitoidentityserviceprovider.adminCreateUser(params).promise();
};

const setUserPassword = async (username: string, password: string): Promise<any> => {
  const params = {
    UserPoolId: UserPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  };
  return cognitoidentityserviceprovider.adminSetUserPassword(params).promise();
};

@Service()
export default class AuthenticationService {
  @Initializer()
  async init(): Promise<void> {
  }

  generatePassword(length: number = 10): string {
    const randomPass = cryptoRandomString({ length: length, type: 'base64' });
    console.log('randomPass :>> ', randomPass);
    return randomPass;
  }

  async createUser(username: string, password: string, mobileNo?: string): Promise<any> {
    try {
      const userData = await userRepository.add({
        phoneNumber: username
      });
      console.log('userData :>> ', userData);
      const signUpSuccess = await signUp(username, password, userData.id.toString());
      console.log('signUpSuccess :>> ', signUpSuccess);
      await setUserPassword(username, password);
      const encryptPassword = await utility.encryptByKms(password, process.env.MASTER_KEY_ID || '')
      let userAttribute: any = {
        username,
        password: encryptPassword,
      }
      if (mobileNo) { // signin with mobile
        userAttribute = { ...userAttribute, mobileNo }
      }
      const userDynamo = await userDynamoRepository.create(userAttribute);
      console.log('userDynamo :>> ', userDynamo);
      return userData;
    } catch (err: any) {
      console.log('err :>> ', err);
      const errorMessage: any = { code: 'CREATE_USER_ERROR', message: 'Cannot create user' }
      throw errorMessage
    }
  }

  async signin(username: string, password: string): Promise<any> {
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = getCognitoToUser(username);
    return new Promise((resolve, reject) => {
      console.log('AuthenticateUser');
      cognitoUser.authenticateUser(authenticationDetails, {
        async onSuccess(session) {
          const userTokens = getTokens(session);
          console.log('onSuccess :: ', userTokens);
          return resolve(userTokens);
        },
        async onFailure(err) {
          console.log('On Failure :: ', err);
          return reject(err);
        }
      });
    });
  };

  async refreshToken(token: string): Promise<NewTokenGenerate | undefined> {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: AppClient,
      AuthParameters: {
        'REFRESH_TOKEN': token
      },
    };
    const { AuthenticationResult } = await cognitoidentityserviceprovider.initiateAuth(params).promise();
    return {
      accessToken: AuthenticationResult?.AccessToken,
      expiresIn: AuthenticationResult?.ExpiresIn,
      tokenType: AuthenticationResult?.TokenType,
      idToken: AuthenticationResult?.IdToken,
    }
  }

  async getUserProfile(filter: FilterUserProfile): Promise<any> {
    const options = {
      select: ['id', 'fullName', 'phoneNumber', 'email', 'userType', 'avatar', 'attachCodeCitizenId', 'documentStatus', 'document', 'lineId']
    }
    const userProfile = await userRepository.findOneByAttribute(filter, options);
    console.log("User Profile service :: ", userProfile)
    return {
      id: userProfile.id,
      userId: utility.encodeUserId(userProfile.id),
      companyName: userProfile.fullName,
      fullName: userProfile.fullName,
      mobileNo: userProfile.phoneNumber,
      email: userProfile.email,
      userType: userProfile.userType,
      avatar: userProfile.avatar,
      attachCodeCitizenId: userProfile.attachCodeCitizenId,
      documentStatus: userProfile.documentStatus,
      document: userProfile.document,
      lineId: userProfile.lineId
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    const mainUrl = process.env.MESSAGING_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/messaging';
    const response = await axios.post(`${mainUrl}/sms/send`, { phoneNumber, message });
    return response.data
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
