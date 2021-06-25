import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import UserProfileRepository from '../repositories/user-profile.repository'
import UserRoleService from './user-role.service'
import Utility from 'utility-layer/dist/security'
import axios from 'axios';
import { FindManyOptions, FindOperator, ILike, Like } from 'typeorm';
import { UserProfileCreateEntity } from '../repositories/repository.types';

interface AddNormalUser {
  phoneNumber: string
  fullname?: string
  email?: string
  userType?: number
  createdAt?: Date
  createdBy?: string
  confirmationToken?: string
  attachCode?: string[]
}

interface UserFilterCondition {
  fullname?: FindOperator<string>
  email?: FindOperator<string>
  phoneNumber?: FindOperator<string>
}

interface GetUserParams {
  fullName?: string
  email?: string
  phoneNumber?: string
  rowsPerPage?: number
  page?: number
  descending?: boolean
  sortBy?: 'id' | 'email' | 'fullname' | 'phoneNumber'
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
  legalType?: 'INDIVIDUAL' | 'JURISTIC'
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

const updateUsername = async (oldUsername: string, newUsername: string, updateTo: 'email' | 'phone_number'): Promise<any> => {
  const params = {
    UserAttributes: [
      {
        Name: updateTo,
        Value: newUsername,
      },
    ],
    UserPoolId: UserPoolId,
    Username: oldUsername,
  };
  return cognitoidentityserviceprovider.adminUpdateUserAttributes(params).promise();
}

@Service()
export default class UserService {

  private emailFormat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  private phoneNumberFormat = /^\+?([0-9]{2})\)??([0-9]{9})$/;

  @Initializer()
  async init(): Promise<void> {
  }

  // Only normal user, username is phone number
  async createNormalUser(data: AddNormalUser): Promise<any> {
    try {
      const username = data.phoneNumber
      if (!username.match(this.phoneNumberFormat)) {
        throw new Error('Phone number first character should be +66 or etc.');
      }
      const userExisting = await userDynamoRepository.findByUsernameWithPhoneNumber(username);
      if (userExisting) {
        throw new Error('Phone number must be unique');
      }
      const userData = await userProfileRepository.add({
        ...data,
        ...(data?.attachCode?.length ? { document: { idDoc: data.attachCode[0] } } : undefined)
      });
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

      if (data?.attachCode?.length) {
        const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
        await axios.post(`${fileManagementUrl}/api/v1/media/confirm`, { url: data.attachCode });
      }

      return userData;
    } catch (err) {
      console.log('err :>> ', JSON.stringify(err));
      // const errorMessage: any = { code: 'CREATE_USER_ERROR', message: 'Cannot create user' }
      throw err;
    }
  }

  async resetPassword(username: string, password: string): Promise<any> {
    const encryptPassword: any = await utility.encryptByKms(password, process.env.MASTER_KEY_ID || '');
    await setUserPassword(username, password);
    return userDynamoRepository.updatePassword(username, encryptPassword);
  }

  async sendEmailForResetPassword(email: string, token: string): Promise<any> {
    const mainUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
    const link = `${process.env.BACK_OFFICE_URL}/auth/reset-password/?token=${token}`;
    await axios.post(`${mainUrl}/api/v1/messaging/email/send`, {
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
      fullName,
      email,
      phoneNumber,
      rowsPerPage,
      page,
      descending,
      sortBy = 'id'
    } = opts

    let cond: UserFilterCondition[] = []

    if (fullName) {
      cond.push({ fullname: Like(`%${fullName}%`) })
    }
    if (email) {
      cond.push({ email: Like(`%${email}%`) })
    }
    if (phoneNumber) {
      const phoneNumberForSearch: string = phoneNumber.slice(0, 1) === '0' ? phoneNumber.slice(1) : phoneNumber;
      cond.push({ phoneNumber: Like(`%${phoneNumberForSearch}%`) })
    }

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
        [sortBy]: descending ? 'DESC' : 'ASC'
      }
    }
    const users = await userProfileRepository.findAndCount(filter);

    // const users = await userProfileRepository.findAndOrCondition(cond, numbOfLimit, numbOfPage, !!descending, sortBy);
    // console.log('JSON.stringify(users) :>> ', JSON.stringify(users));

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
    const { userId, name, email, phoneNumber, attachCode, legalType } = params;
    let data: UserProfileCreateEntity = {}

    if (phoneNumber) {
      if (!phoneNumber.match(this.phoneNumberFormat)) {
        throw new Error('Phone number first character should be +66 or etc.')
      }
      data.phoneNumber = phoneNumber
    }

    const id = utility.decodeUserId(userId);

    data = {
      ...data,
      ...(name ? { fullname: name } : undefined),
      ...(email ? { email: email } : undefined),
      ...(legalType ? { legalType: legalType } : undefined),
      updatedAt: new Date(),
    }

    const userDetailBackup = await userProfileRepository.findOne(id);
    const updated = userProfileRepository.update(id, data);

    try {
      const usernameIsEmail = await userRoleService.isAdminOrCustomerService(id);

      if (usernameIsEmail) {
        if (phoneNumber) {
          await userDynamoRepository.updatePhoneNumber(userDetailBackup.email, phoneNumber);
        }
        if (email) {
          await userDynamoRepository.updateUsername(userDetailBackup.email, email);
          await updateUsername(userDetailBackup.email, email, 'email');
        }
      } else {
        if (phoneNumber) {
          await userDynamoRepository.updateUsername(userDetailBackup.phoneNumber, phoneNumber);
          await updateUsername(userDetailBackup.phoneNumber, phoneNumber, 'phone_number');
        }
      }

      if (attachCode?.length) {
        await userProfileRepository.update(id, { document: { idDoc: attachCode[0] } });
        const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
        await axios.post(`${fileManagementUrl}/api/v1/media/confirm`, { url: attachCode });
      }

      return updated;
    } catch (err) {
      delete userDetailBackup.id
      await userProfileRepository.update(id, userDetailBackup);
      throw err;
    }
  }

  async getProfileByUserId(userId: string): Promise<any> {
    const id = utility.decodeUserId(userId);

    const user = await userProfileRepository.findOne(id);
    let fileNames: Array<string> = []

    if (user?.document) {
      // idDoc
      const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
      const response = await axios.get(`${fileManagementUrl}/api/v1/media/file-by-attach-code`, { params: { url: JSON.stringify(Object.values(user.document)) } });
      fileNames = response.data.data.map((user: any) => user.file_name);
    }

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
