import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import UserDynamodbRepository from "../repositories/user.dynamodb.repository";
import UserProfileRepository from '../repositories/user-profile.repository'
import UserRoleService from './user-role.service'
import Utility from 'utility-layer/dist/security'
import axios from 'axios';
import { FindManyOptions, FindOperator, ILike, Like } from 'typeorm';
import { UserProfileCreateEntity } from '../repositories/repository.types';
import UserJobSummaryRepository from '../repositories/user-summary.repository'
import TermOfServiceUserService from './term-of-service-user.service';
import _ from 'lodash'
import e from 'cors';
interface AddNormalUser {
  phoneNumber: string
  fullName?: string
  email?: string
  userType?: 'SHIPPER' | 'CARRIER' | 'BOTH'
  createdAt?: Date
  createdBy?: string
  confirmationToken?: string
  url?: string[]
}

interface UserFilterCondition {
  fullName?: FindOperator<string>
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
  sortBy?: 'id' | 'email' | 'fullName' | 'phoneNumber'
}

interface GetUserResponse {
  data: Array<any>
  count: number
}

interface UpdateUserProfile {
  userId: string
  fullName?: string
  phoneNumber?: string
  email?: string
  legalType?: 'INDIVIDUAL' | 'JURISTIC'
  url?: string[]
  avatar?: string
  userType?: 'SHIPPER' | 'CARRIER' | 'BOTH'
  attachCodeCitizenId?: string
  acceptTermAndCondition?: string
}

type UserDocumentStatus = "NO_DOCUMENT" | "WAIT_FOR_VERIFIED" | "VERIFIED" | "REJECTED";

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
const termOfServiceUserService = new TermOfServiceUserService();

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


const deleteDocument = (document: object, docId: string) => {
  let tmpData = document

  Object.keys(document).map((e) => {
    if (document[e] == docId) {
      delete document[e]
    }
  })

  let newDocument = {}
  let minusIndex = false
  Object.keys(document).forEach((e, i) => {
    if (Number(e) != i) {
      minusIndex = true
    }
    if (minusIndex) {
      newDocument[(i).toString()] = tmpData[(i + 1).toString()] ? tmpData[(i + 1).toString()] : null
    } else {
      newDocument[e] = tmpData[e]
    }
  })
  return newDocument
}

@Service()
export default class UserService {

  private emailFormat = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  private phoneNumberFormat = /^\+?([0-9]{2})\)??([0-9]{9})$/;

  @Initializer()
  async init(): Promise<void> {
  }


  async deleteDocumentById(userId: number, docId: string): Promise<any> {
    const data = await userProfileRepository.findOne(userId)

    if (data && data.document && typeof data.document == 'object') {
      let newDocument = deleteDocument(data.document, docId)
      console.log("New document affter delete : ", newDocument)
      data.document = typeof newDocument == 'object' && Object.keys(newDocument).length > 0 ? newDocument : null
      await userProfileRepository.update(data.id, data)
      return { message: true }
    } else {
      return { message: false }
    }
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
        ...(data?.url?.length ? { document: JSON.parse(JSON.stringify(Object.assign({}, data.url))) } : undefined)
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

      if (data?.url?.length) {
        const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
        await axios.post(`${fileManagementUrl}/api/v1/media/confirm`, { url: data.url });
      }

      return {
        ...userData,
        userId: utility.encodeUserId(userData.id)
      };
    } catch (err: any) {
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
      cond.push({ fullName: ILike(`%${fullName}%`) })
    }
    if (email) {
      cond.push({ email: ILike(`%${email}%`) })
    }
    if (phoneNumber) {
      const phoneNumberForSearch: string = phoneNumber.slice(0, 1) === '0' ? phoneNumber.slice(1) : phoneNumber;
      cond.push({ phoneNumber: ILike(`%${phoneNumberForSearch}%`) })
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

  async updateUserDocumentStatus(userId: string, status: 'NO_DOCUMENT' | 'WAIT_FOR_VERIFIED' | 'VERIFIED' | 'REJECTED'): Promise<any> {
    const id = utility.decodeUserId(userId);
    if (status === 'VERIFIED') {
      await userRoleService.updateRoleMemberToPartner(id);
    }
    return userProfileRepository.update(id, { documentStatus: status });
  }

  async updateUserProfile(params: UpdateUserProfile): Promise<any> {
    const { userId, fullName, email, phoneNumber, url, legalType, avatar, userType, attachCodeCitizenId, acceptTermAndCondition } = params;
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
      ...(fullName ? { fullName: fullName } : undefined),
      ...(email ? { email: email } : undefined),
      ...(legalType ? { legalType: legalType } : undefined),
      ...(avatar ? { avatar: avatar } : undefined),
      ...(userType ? { userType: userType } : undefined),
      ...(attachCodeCitizenId ? { attachCodeCitizenId } : undefined),
      updatedAt: new Date(),
    }

    try {
      let acceptTermAndConditionResult: any
      if (acceptTermAndCondition) {
        acceptTermAndConditionResult = termOfServiceUserService.acceptTermOrServicePartner(userId, acceptTermAndCondition);
      }

      const userDetailBackup = await userProfileRepository.findOne(id);
      const isAdminOrCustomerService = await userRoleService.isBackofficeUser(id);

      if (phoneNumber) {
        const username = isAdminOrCustomerService ? userDetailBackup.email : userDetailBackup.phoneNumber
        await userDynamoRepository.updateUsername(username, phoneNumber);
      }

      if (isAdminOrCustomerService && email) {
        await userDynamoRepository.updateUsername(userDetailBackup.email, email);
        await updateUsername(userDetailBackup.email, email, 'email');
      }

      if (url?.length) {
        const arrDocument = userDetailBackup?.document ? Object.values(userDetailBackup.document) : [];
        const newArrDocument = [...arrDocument, ...url]
        data = { ...data, document: JSON.parse(JSON.stringify(Object.assign({}, newArrDocument))), documentStatus: 'WAIT_FOR_VERIFIED' };
        const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
        await axios.post(`${fileManagementUrl}/api/v1/media/confirm`, { url: url });
      }
      await acceptTermAndConditionResult;

      return userProfileRepository.update(id, data);
    } catch (err: any) {
      console.log('err :>> ', err);
      // delete userDetailBackup.id
      // await userProfileRepository.update(id, userDetailBackup);
      throw err;
    }
  }

  async getProfileByUserId(userId: string): Promise<any> {
    const id = utility.decodeUserId(userId);

    const roleName = userRoleService.getRoleNameByUserId(id);
    const user = await userProfileRepository.findOne(id);
    let fileNames: Array<string> = []

    if (user?.document) {
      // idDoc
      // const fileManagementUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
      // const response = await axios.get(`${fileManagementUrl}/api/v1/media/file-by-attach-code`, { params: { url: JSON.stringify(Object.values(user.document)) } });
      // fileNames = response.data.data.map((user: any) => user.file_name);

      Object.keys(user.document).map(e => fileNames.push(user.document[e]))
    }

    return { ...user, files: fileNames, roleName: await roleName }
  }

  async checkUserActive(username: string): Promise<boolean> {
    let attr: any = {
      status: UserStatus.ACTIVE,
      ...(username.match(this.emailFormat) ? { email: username } : { phoneNumber: username })
    }
    const user = await userProfileRepository.findOneByAttribute(attr);

    return !!user
  }

  async updateUserFile(userId: number, url: string[]): Promise<any> {
    const findUser = await userProfileRepository.findOne(userId)
    if (!findUser.document) {
      const newDocument = {}
      url.forEach((e, i) => {
        newDocument[i] = e
      })
      findUser.document = newDocument
    } else {
      const tmpDocument = findUser.document
      const startLength = Object.keys(tmpDocument).length
      url.forEach((e, i) => {
        tmpDocument[startLength + i] = e
      })
      console.log(tmpDocument)
      findUser.document = tmpDocument
    }
    findUser.documentStatus = "WAIT_FOR_VERIFIED"
    const updateProfile = await userProfileRepository.update(userId, findUser)
    return updateProfile
  }


  getReportMyTruck(listMyTrucks: { data: Array<ModelTruck> }) {
    console.log("LIst mhy truck  : ", listMyTrucks)
    let countTruckType = Object.values(listMyTrucks.data.reduce((r, { truckType }) => {
      r[truckType] ??= { truckType, total: 0 };
      r[truckType].total++;
      return r;
    }, {}));
    console.log("Mapping Truck type :: ", countTruckType)
    return countTruckType
  }

  getWorkingZone(listMyTrucks: { data: Array<ModelTruck> }) {
    let arr: Array<{ region: number, province: number }> = []
    listMyTrucks.data.map((e: ModelTruck) => {
      const workZone = JSON.parse(JSON.stringify(e.workingZones)) || []
      if (workZone && Array.isArray(workZone) && workZone.length > 0) {
        arr = [...arr, ...workZone]
      }
    })
    return _.uniqBy(arr, 'province');
  }

  async userAndTruckSummary(userId: number, authorization: string) {
    const mainUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
    const listMyTrucks = await axios.get(`${mainUrl}/api/v1/trucks/me/all`, { headers: { Authorization: authorization } });
    let mappingTruck = JSON.parse(JSON.stringify(listMyTrucks.data))

    const reportMyTruck = this.getReportMyTruck(mappingTruck)
    const reportWorkingZones = this.getWorkingZone(mappingTruck)
    const repo = new UserJobSummaryRepository()
    const myProfile = await repo.findOne(userId, {})

    myProfile['trucks'] = reportMyTruck
    myProfile['workingZones'] = reportWorkingZones

    console.log("MyProfile : ", myProfile)

    // return myProfile
    return myProfile
  }





  async userAndTruckSummaryWithoutAuthorize(userId: number, encodeId: string, authorization: string) {
    const mainUrl = process.env.API_URL || 'https://2kgrbiwfnc.execute-api.ap-southeast-1.amazonaws.com/prod';
    const listMyTrucks = await axios.get(`${mainUrl}/api/v1/trucks/me/list-all/${encodeId}`, { headers: { authorization } });
    let mappingTruck = JSON.parse(JSON.stringify(listMyTrucks.data))

    const reportMyTruck = this.getReportMyTruck(mappingTruck)
    // console.log("Map report truck : ",reportMyTruck)
    const reportWorkingZones = this.getWorkingZone(mappingTruck)
    // console.log("Report working :: ",reportWorkingZones)
    const repo = new UserJobSummaryRepository()
    const myProfile = await repo.findOne(userId, {})
    console.log("My profile :: " + userId + " :", myProfile)
    myProfile.trucks = reportMyTruck
    myProfile.workingZones = reportWorkingZones

    console.log("MyProfile : ", myProfile)

    // return myProfile
    return myProfile
  }

  async getDocumentStatus(userId: number): Promise<any> {
    const user = await userProfileRepository.findOne(userId);
    if (user) {
      return user.documentStatus;
    }
    throw new Error('USER_DOES_NOT_EXISTS');
  }

  mappingMessageByDocumentStatus(documentStatus: UserDocumentStatus): string | null {
    if (documentStatus === 'WAIT_FOR_VERIFIED') {
      return 'Wait for approval'
    } else if (documentStatus === 'VERIFIED') {
      return 'Your account has been verified.'
    } else {
      return null;
    }
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}

export interface ModelTruck {
  "id": string,
  "approveStatus": string | null,
  "loadingWeight": number | null,
  "registrationNumber": string[],
  "stallHeight": string | null,
  "tipper": boolean,
  "truckType": number,
  "createdAt": string | null,
  "updatedAt": string | null,
  "quotationNumber": number | null,
  "workingZones": Array<{ region: number | null, province: number | null }>
}

export interface ReportTrucks {
  truckType: number
  total: number
}
