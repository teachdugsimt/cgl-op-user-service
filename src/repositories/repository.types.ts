
export interface UserDataCreateType {
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

  is_locked?: boolean;

  account_type?: number;

  approve_status?: number

  is_deleted?: boolean

  version?: number
}
