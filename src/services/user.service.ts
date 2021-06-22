import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import UserProfileRepository from '../repositories/user-profile.repository'
import UserRoleService from './user-role.service'
import Utility from 'utility-layer/dist/security'
import axios from 'axios';
import { FindManyOptions, FindOperator, ILike } from 'typeorm';

interface AddNormalUser {
  phoneNumber: string
  fullname?: string
  email?: string
  userType?: number
  createdAt?: Date
  createdBy?: string
  confirmationToken?: string
}

interface UserFilterCondition {
  fullname?: FindOperator<string>
  email?: FindOperator<string>
  phoneNumber?: FindOperator<string>
}

interface GetUserParams {
  name?: string
  email?: string
  phoneNumber?: string
  rowsPerPage?: number
  page?: number
  descending?: boolean
}

interface GetUserResponse {
  data: Array<any>
  count: number
}

interface UpdateUserProfile {
  userId: string
  name?: string
  phoneNumber?: string
  email?: string
  attachCode?: string[]
}

enum UserStatus {
  ACTIVE = 'ACTIVE'
}

enum UserTypes {
  DOC = 'USER_DOC'
}

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const userDynamoRepository = new UserDynamodbRepository();
const userProfileRepository = new UserProfileRepository();
const userRoleService = new UserRoleService();
const utility = new Utility();

const UserPoolId = process.env.USER_POOL_ID || '';

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

  private emailFormat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

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
      const password = utility.generatePassword(12);
      const userId = utility.encodeUserId(+userData.id);
      const signUpSuccess = await signUp(username, password, userId);
      console.log('signUpSuccess :>> ', signUpSuccess);
      await setUserPassword(username, password);
      const encryptPassword = await utility.encryptByKms(password, process.env.MASTER_KEY_ID || '')
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
    const encryptPassword: any = await utility.encryptByKms(password, process.env.MASTER_KEY_ID || '');
    await setUserPassword(username, password);
    return await userDynamoRepository.update({
      username: username,
      password: encryptPassword
    })
  }

  async sendEmailForResetPassword(email: string, token: string): Promise<any> {
    const mainUrl = process.env.MESSAGING_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/messaging';
    const link = `https://infiltech.org/?token=${token}`;
    await axios.post(`${mainUrl}/email/send`, {
      email: email,
      subject: 'Reset your password for CargoLink',
      bodyText: `<p>Hello,</p>

      <p>Follow this link to reset your CargoLink password for your ${email} account.</p>
      <a href="${link}" target="_bank">${link}</a>
      <p>If you didn't ask to reset your passworrd, you can ignore this email.</p>
      
      <p>Thanks,</p>
      <p>CargoLink team</p>`
    });
  }

  async signOut(token: string): Promise<any> {
    const params = {
      AccessToken: token
    };
    return cognitoidentityserviceprovider.globalSignOut(params).promise();
  }

  async getAllUser(opts: GetUserParams): Promise<GetUserResponse> {
    let {
      name,
      email,
      phoneNumber,
      rowsPerPage,
      page,
      descending } = opts

    let cond: UserFilterCondition = {}

    if (name) cond.fullname = ILike(`%${name}%`)
    if (email) cond.email = ILike(`%${email}%`)
    if (phoneNumber) cond.phoneNumber = ILike(`%${phoneNumber}%`)

    let numbOfPage: number;
    let numbOfLimit: number;
    if (rowsPerPage) {
      numbOfLimit = +rowsPerPage;
    } else {
      numbOfLimit = 10;
    }
    if (page) {
      numbOfPage = +page === 1 ? 0 : (+page - 1) * numbOfLimit;
    }
    else {
      numbOfPage = 0;
    }

    const filter: FindManyOptions = {
      where: cond,
      take: numbOfLimit,
      skip: numbOfPage,
      order: {
        id: descending ? 'DESC' : 'ASC'
      }
    }
    const users = await userProfileRepository.findAndCount(filter);

    return {
      data: users[0] || [],
      count: users[1] || 0,
    }
  }

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<any> {
    const id = utility.decodeUserId(userId);
    return userProfileRepository.update(id, { status: status });
  }

  async updateUserDocumentStatus(userId: string, status: 'NO_DOCUMENT' | 'WAIT_FOR_VERIFIED' | 'VERIFIED'): Promise<any> {
    const id = utility.decodeUserId(userId);
    return userProfileRepository.update(id, { documentStatus: status });
  }

  async updateUserProfile(params: UpdateUserProfile): Promise<any> {
    const { userId, name, phoneNumber, email, attachCode } = params;
    const id = utility.decodeUserId(userId);
    const data = {
      ...(name ? { fullname: name } : undefined),
      ...(phoneNumber ? { phoneNumber: phoneNumber } : undefined),
      ...(email ? { email: email } : undefined),
      updatedAt: new Date(),
    }

    const updated = userProfileRepository.update(id, data);

    if (attachCode?.length) {
      const fileManagementUrl = process.env.FILE_MANAGEMENT_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/media';
      await axios.post(`${fileManagementUrl}/confirm`, { url: attachCode });
    }

    return updated;
  }

  async getProfileByUserId(userId: string): Promise<any> {
    const id = utility.decodeUserId(userId);

    const fileManagementUrl = process.env.FILE_MANAGEMENT_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1/media';
    const response = axios.post(`${fileManagementUrl}/file`, { userId: id, fileType: UserTypes.DOC, status: UserStatus.ACTIVE });

    const user = await userProfileRepository.findOne(id);

    const fileNames = (await response).data.data.map((user: any) => user.file_name);

    return { ...user, files: fileNames }
  }

  async checkUserActive(username: string): Promise<boolean> {
    let attr: any = {
      status: UserStatus.ACTIVE,
      ...(username.match(this.emailFormat) ? { email: username } : { phoneNumber: username })
    }
    const user = await userProfileRepository.findOneByAttribute(attr);

    return !!user
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
