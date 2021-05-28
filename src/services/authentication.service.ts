import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js'
import cryptoRandomString from 'crypto-random-string';
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import Utillity from './util.service'

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const userDynamoRepository = new UserDynamodbRepository();
const utillity = new Utillity();

const UserPoolId = process.env.USER_POOL_ID || 'ap-southeast-1_gJ5IDZHTF';
const AppClient = process.env.CLIENT_ID || '1ivatr3het7akcs4kdkmv0vagi';

const getTokens = (tokens: any) => {
  return {
    idToken: tokens.getIdToken().getJwtToken(),
    accessToken: tokens.getAccessToken().getJwtToken(),
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

const signUp = async (username: string, password: string): Promise<any> => {
  const params = {
    UserPoolId: UserPoolId,
    Username: username,
    TemporaryPassword: password,
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      {
        Name: 'custom:userId',
        Value: utillity.generateUpperUniqueId(8)
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

  ping(): string {
    return 'pong'
  }

  generatePassword(length: number = 10): string {
    const randomPass = cryptoRandomString({ length: length, type: 'base64' });
    console.log('randomPass :>> ', randomPass);
    return randomPass;
  }

  async createUser(username: string, password: string, mobileNo?: string): Promise<any> {
    try {
      const signUpSuccess = await signUp(username, password);
      console.log('signUpSuccess :>> ', signUpSuccess);
      await setUserPassword(username, password);
      const encryptPassword = await utillity.encryptByKms(password)
      let userAttribute: any = {
        username,
        password: encryptPassword,
      }
      if (mobileNo) { // signin with mobile
        userAttribute = { ...userAttribute, mobileNo }
      }
      const userDynamo = await userDynamoRepository.create(userAttribute);
      console.log('userDynamo :>> ', userDynamo);
      return userDynamo;
    } catch (err) {
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

  async refreshToken(token: string) {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: AppClient,
      AuthParameters: {
        'REFRESH_TOKEN': token
      },
    };
    return await cognitoidentityserviceprovider.initiateAuth(params).promise();
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
