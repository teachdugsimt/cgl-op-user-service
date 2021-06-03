import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("users_pkey", ["id"], { unique: true })
@Entity("users", { schema: "public" })
export class Users {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("character varying", {
    name: "confirmation_token",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  confirmationToken!: string | null;

  @Column("character varying", {
    name: "email",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  email!: string | null;

  @Column("boolean", {
    name: "enabled",
    nullable: true,
    default: () => "false",
  })
  enabled!: boolean | null;

  @Column("character varying", {
    name: "fullname",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  fullname!: string | null;

  @Column("character varying", {
    name: "password",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  password!: string | null;

  @Column("integer", {
    name: "payment_status",
    nullable: true,
    default: () => "0",
  })
  paymentStatus!: number | null;

  @Column("character varying", {
    name: "contact_person",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  contactPerson!: string | null;

  @Column("character varying", {
    name: "number_id",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  numberId!: string | null;

  @Column("character varying", {
    name: "phone_number",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  phoneNumber!: string | null;

  @Column("character varying", {
    name: "phone_number_contact",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  phoneNumberContact!: string | null;

  @Column("character varying", {
    name: "registered_address",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  registeredAddress!: string | null;

  @Column("character varying", {
    name: "tax_code",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  taxCode!: string | null;

  @Column("character varying", {
    name: "transaction_address",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  transactionAddress!: string | null;

  @Column("integer", { name: "user_type", default: () => "0" })
  userType!: number;

  @Column("character varying", {
    name: "type_cargo",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  typeCargo!: string | null;

  @Column("character varying", {
    name: "token_reset_pass",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  tokenResetPass!: string | null;

  @Column("character varying", {
    name: "field_business",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  fieldBusiness!: string | null;

  @Column("character varying", {
    name: "field_services",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  fieldServices!: string | null;

  @Column("text", {
    name: "legal_representative",
    nullable: true,
    default: () => "NULL::character varying",
  })
  legalRepresentative!: string | null;

  @Column("character varying", {
    name: "bank_account_name",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  bankAccountName!: string | null;

  @Column("character varying", {
    name: "bank_account_number",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  bankAccountNumber!: string | null;

  @Column("character varying", {
    name: "bank_name",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  bankName!: string | null;

  @Column("integer", { name: "version", default: () => "0" })
  version!: number;

  @Column("timestamp without time zone", {
    name: "created_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date | null;

  @Column("timestamp without time zone", {
    name: "updated_at",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date | null;

  @Column("character varying", {
    name: "created_user",
    nullable: true,
    length: 254,
    default: () => "NULL::character varying",
  })
  createdUser!: string | null;

  @Column("character varying", {
    name: "updated_user",
    nullable: true,
    length: 254,
    default: () => "NULL::character varying",
  })
  updatedUser!: string | null;

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted!: boolean;

  @Column("character varying", {
    name: "avatar",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  avatar!: string | null;

  @Column("integer", { name: "carrier_id", nullable: true, default: () => "0" })
  carrierId!: number | null;

  @Column("character varying", {
    name: "driver_license_number",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  driverLicenseNumber!: string | null;

  @Column("character varying", {
    name: "platform",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  platform!: string | null;

  @Column("character varying", {
    name: "device_token",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  deviceToken!: string | null;

  @Column("integer", { name: "approve_status", default: () => "0" })
  approveStatus!: number;

  @Column("timestamp without time zone", {
    name: "approve_date",
    nullable: true,
    default: () => "NULL::timestamp without time zone",
  })
  approveDate!: Date | null;

  @Column("double precision", {
    name: "rating_point",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  ratingPoint!: number | null;

  @Column("integer", {
    name: "rating_times",
    nullable: true,
    default: () => "0",
  })
  ratingTimes!: number | null;

  @Column("integer", {
    name: "payment_method",
    nullable: true,
    default: () => "0",
  })
  paymentMethod!: number | null;

  @Column("double precision", {
    name: "postpaid_limit",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  postpaidLimit!: number | null;

  @Column("character varying", {
    name: "app_language",
    nullable: true,
    length: 20,
    default: () => "'en'",
  })
  appLanguage!: string | null;

  @Column("timestamp without time zone", {
    name: "expiry_date",
    nullable: true,
    default: () => "NULL::timestamp without time zone",
  })
  expiryDate!: Date | null;

  @Column("integer", { name: "account_type", default: () => "0" })
  accountType!: number;

  @Column("integer", {
    name: "sms_verification_sent",
    nullable: true,
    default: () => "0",
  })
  smsVerificationSent!: number | null;

  @Column("double precision", {
    name: "postpaid_available",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  postpaidAvailable!: number | null;

  @Column("boolean", {
    name: "auto_accept_job",
    nullable: true,
    default: () => "false",
  })
  autoAcceptJob!: boolean | null;

  @Column("boolean", {
    name: "multiple_account",
    nullable: true,
    default: () => "false",
  })
  multipleAccount!: boolean | null;

  @Column("integer", {
    name: "driving_license_type",
    nullable: true,
    default: () => "1",
  })
  drivingLicenseType!: number | null;

  @Column("character varying", {
    name: "sales_code",
    nullable: true,
    length: 50,
    default: () => "NULL::character varying",
  })
  salesCode!: string | null;

  @Column("integer", { name: "parent_id", nullable: true })
  parentId!: number | null;

  @Column("character varying", {
    name: "job_title",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  jobTitle!: string | null;

  @Column("boolean", {
    name: "pre_approval_account",
    nullable: true,
    default: () => "false",
  })
  preApprovalAccount!: boolean | null;

  @Column("timestamp without time zone", {
    name: "driving_license_expired_date",
    nullable: true,
    default: () => "NULL::timestamp without time zone",
  })
  drivingLicenseExpiredDate!: Date | null;

  @Column("timestamp without time zone", {
    name: "document_expired_date",
    nullable: true,
    default: () => "NULL::timestamp without time zone",
  })
  documentExpiredDate!: Date | null;

  @Column("character varying", {
    name: "registered_address_no",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  registeredAddressNo!: string | null;

  @Column("character varying", {
    name: "registered_alley",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  registeredAlley!: string | null;

  @Column("character varying", {
    name: "registered_street",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  registeredStreet!: string | null;

  @Column("integer", { name: "registered_district", nullable: true })
  registeredDistrict!: number | null;

  @Column("integer", { name: "registered_province", nullable: true })
  registeredProvince!: number | null;

  @Column("character varying", {
    name: "registered_postcode",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  registeredPostcode!: string | null;

  @Column("character varying", {
    name: "transaction_address_no",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  transactionAddressNo!: string | null;

  @Column("character varying", {
    name: "transaction_alley",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  transactionAlley!: string | null;

  @Column("character varying", {
    name: "transaction_street",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  transactionStreet!: string | null;

  @Column("integer", { name: "transaction_district", nullable: true })
  transactionDistrict!: number | null;

  @Column("integer", { name: "transaction_province", nullable: true })
  transactionProvince!: number | null;

  @Column("character varying", {
    name: "transaction_postcode",
    nullable: true,
    length: 255,
    default: () => "NULL::character varying",
  })
  transactionPostcode!: string | null;

  @Column("integer", {
    name: "login_failed_count",
    nullable: true,
    default: () => "0",
  })
  loginFailedCount!: number | null;

  @Column("boolean", { name: "is_locked", default: () => "false" })
  isLocked!: boolean;

  @Column("double precision", {
    name: "commission_fee",
    nullable: true,
    precision: 53,
    default: () => "0",
  })
  commissionFee!: number | null;

  @Column("integer", { name: "registered_sub_district", nullable: true })
  registeredSubDistrict!: number | null;

  @Column("integer", { name: "transaction_sub_district", nullable: true })
  transactionSubDistrict!: number | null;

  @Column("character varying", {
    name: "reject_note",
    nullable: true,
    length: 550,
    default: () => "NULL::character varying",
  })
  rejectNote!: string | null;
}
