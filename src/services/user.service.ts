import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import UserProfileRepository from '../repositories/user-profile.repository'
import UserRoleService from './user-role.service'
import Utillity from './util.service'

interface AddNormalUser {
  phoneNumber: string
  fullname?: string
  email?: string
  userType?: number
  createdAt?: Date
  createdBy?: string
  confirmationToken?: string
}

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const userDynamoRepository = new UserDynamodbRepository();
const userProfileRepository = new UserProfileRepository();
const userRoleService = new UserRoleService();
const utillity = new Utillity();

const UserPoolId = process.env.USER_POOL_ID || 'ap-southeast-1_tfXXNZA76';

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
export default class UserService {
  @Initializer()
  async init(): Promise<void> {
  }

  // Only normal user, username is phone number
  async createNormalUser(data: AddNormalUser): Promise<any> {
    try {
      const username = data.phoneNumber
      const userExisting = await userDynamoRepository.findByUsername(username);
      if (userExisting) {
        throw { responseCode: 'USER_EXISTING', message: 'Phone number must be unique' }
      }
      const userData = await userProfileRepository.add(data);
      console.log('userData :>> ', userData);
      const password = utillity.generatePassword(12);
      const userId = utillity.encodeUserId(userData.id.toString());
      const signUpSuccess = await signUp(username, password, userId);
      console.log('signUpSuccess :>> ', signUpSuccess);
      await setUserPassword(username, password);
      const encryptPassword = await utillity.encryptByKms(password)
      const userAttribute: any = {
        username,
        password: encryptPassword,
      }
      const userDynamo = await userDynamoRepository.create(userAttribute);
      console.log('userDynamo :>> ', userDynamo);
      await userRoleService.addRoleToUser(+userData.id);
      return userData;
    } catch (err) {
      console.log('err :>> ', JSON.stringify(err));
      const errorMessage: any = { code: 'CREATE_USER_ERROR', message: 'Cannot create user' }
      throw errorMessage
    }
  }

  async resetPassword(username: string, password: string): Promise<any> {
    const encryptPassword: any = await utillity.encryptByKms(password);
    await setUserPassword(username, password);
    return await userDynamoRepository.update({
      username: username,
      password: encryptPassword
    })
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
