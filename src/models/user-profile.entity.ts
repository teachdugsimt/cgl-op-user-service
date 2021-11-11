import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import Utility from 'utility-layer/dist/security'

const util = new Utility();

@Entity("user_profile", { schema: "public" })
export class UserProfile {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("character varying", {
    name: "confirmation_token",
    nullable: true,
    length: 100,
  })
  confirmationToken!: string | null;

  @Column("character varying", { name: "email", nullable: true, length: 100 })
  email!: string | null;

  @Column("character varying", {
    name: "phone_number",
    nullable: true,
    length: 20,
  })
  phoneNumber!: string | null;

  @Column("character varying", {
    name: "fullname",
    nullable: true,
    length: 120,
  })
  fullName!: string | null;

  @Column("boolean", { name: "enabled", nullable: true, default: () => "true" })
  enabled!: boolean | null;

  @Column("enum", {
    name: "user_type",
    enum: ["SHIPPER", "CARRIER", "BOTH"],
  })
  userType!: "SHIPPER" | "CARRIER" | "BOTH";

  @Column("character varying", { name: "avatar", nullable: true, length: 255 })
  avatar!: string | null;

  @Column("character varying", {
    name: "device_token",
    nullable: true,
    length: 255,
  })
  deviceToken!: string | null;

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
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updatedAt!: Date | null;

  @Column("character varying", {
    name: "created_by",
    nullable: true,
    length: 120,
  })
  createdBy!: string | null;

  @Column("character varying", {
    name: "updated_by",
    nullable: true,
    length: 120,
  })
  updatedBy!: string | null;

  @Column("enum", {
    name: "status",
    enum: ["ACTIVE", "INACTIVE"],
    default: () => "'ACTIVE'",
  })
  status!: "ACTIVE" | "INACTIVE";

  @Column("enum", {
    name: "document_status",
    enum: ["NO_DOCUMENT", "WAIT_FOR_VERIFIED", "VERIFIED", "REJECTED"],
    default: () => "'NO_DOCUMENT'",
  })
  documentStatus!: "NO_DOCUMENT" | "WAIT_FOR_VERIFIED" | "VERIFIED" | "REJECTED";

  @Column("enum", {
    name: "legal_type",
    enum: ['INDIVIDUAL', 'JURISTIC'],
    default: () => "'INDIVIDUAL'",
  })
  legalType!: 'INDIVIDUAL' | 'JURISTIC';

  @Column("character varying", {
    name: "attach_code_citizen_id",
    nullable: true,
    length: 255,
  })
  attachCodeCitizenId!: string | null;

  @Column("jsonb", { name: "document", nullable: true })
  document!: object | null;

  @Column("character varying", {
    name: "line_id",
    nullable: true,
    length: 50,
  })
  lineId!: string | null;

  userId!: string;

  @AfterLoad()
  getUserId() {
    this.userId = util.encodeUserId(+this.id);
  }

  @BeforeInsert()
  @BeforeUpdate()
  updateDateTime() {
    this.updatedAt = new Date();
  }
}
