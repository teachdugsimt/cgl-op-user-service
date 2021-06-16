import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
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
  fullname!: string | null;

  @Column("boolean", { name: "enabled", nullable: true, default: () => "true" })
  enabled!: boolean | null;

  @Column("smallint", { name: "user_type", nullable: true })
  userType!: number | null;

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

  userId!: string;

  @AfterLoad()
  getUserId() {
    this.userId = util.encodeUserId(+this.id);
  }
}
