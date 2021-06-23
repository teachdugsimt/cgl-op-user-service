
export interface UserDataCreateEntity {
  // id: string;

  confirmationToken?: string;

  email?: string;

  enabled?: boolean;

  fullname?: string;

  password?: string;

  paymentStatus?: number;

  contactPerson?: string;

  numberId?: string;

  phoneNumber?: string;

  phoneNumberContact?: string;

  registeredAddress?: string;

  taxCode?: string;

  transactionAddress?: string;

  userType?: number;

  typeCargo?: string;

  tokenResetPass?: string;

  fieldBusiness?: string;

  fieldServices?: string;

  legalRepresentative?: string;

  bankAccountName?: string;

  bankAccountNumber?: string;

  bankName?: string;

  createdAt?: Date;

  updatedAt?: Date;

  createdUser?: string;

  updatedUser?: string;

  avatar?: string;

  driverLicenseNumber?: string;

  platform?: string;

  deviceToken?: string;

  approveDate?: Date;

  ratingPoint?: number;

  ratingTimes?: number;

  paymentMethod?: number;

  postpaidLimit?: number;

  appLanguage?: string;

  expiryDate?: Date;

  smsVerificationSent?: number;

  postpaidAvailable?: number;

  autoAcceptJob?: boolean;

  multipleAccount?: boolean;

  drivingLicenseType?: number;

  salesCode?: string;

  jobTitle?: string;

  preApprovalAccount?: boolean;

  drivingLicenseExpiredDate?: Date;

  documentExpiredDate?: Date;

  registeredAddressNo?: string;

  registeredAlley?: string;

  registeredStreet?: string;

  registeredPostcode?: string;

  transactionAddressNo?: string;

  transactionAlley?: string;

  transactionStreet?: string;

  transactionPostcode?: string;

  loginFailedCount?: number;

  commissionFee?: number;

  rejectNote?: string;

  isLocked?: boolean;

  accountType?: number;

  approveStatus?: number

  isDeleted?: boolean

  version?: number
}

export interface UserRoleCreateEntity {
  userId: number

  roleId: number
}

export interface TermOfServiceAddEntity {
  versionNumber: string

  data: string

  isActive?: boolean

  version: number

  createdAt?: Date

  updatedAt?: Date

  createdUser?: string

  updatedUser?: string

  isDeleted?: boolean
}

export interface TermOfServiceFindEntity {
  userId: number

  termOfServiceId?: number
}

export interface TermOfServiceUserFindEntity {
  userId: number

  termOfServiceId?: number

  version?: string
}

export interface TermOfServiceUserAddEntity {
  termOfServiceId: number

  userId: number

  version: string

  createdAt?: Date

  updatedAt?: Date

  createdUser?: string

  updatedUser?: string

  isDeleted?: boolean
}

export interface UserProfileCreateEntity {
  // id: string;

  confirmationToken?: string;

  email?: string;

  phoneNumber?: string;

  fullname?: string;

  enabled?: boolean;

  userType?: number;

  avatar?: string;

  deviceToken?: string;

  createdAt?: Date;

  updatedAt?: Date;

  createdBy?: string;

  updatedBy?: string;

  status?: 'ACTIVE' | 'INACTIVE';

  documentStatus?: 'NO_DOCUMENT' | 'WAIT_FOR_VERIFIED' | 'VERIFIED';

  legalType?: 'INDIVIDUAL' | 'JURISTIC'

}
