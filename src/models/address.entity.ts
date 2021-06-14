import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("address", { schema: "public" })
export class Address {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("integer", { name: "user_id" })
  userId!: number;

  @Column("character varying", {
    name: "phone_number_contact",
    nullable: true,
    length: 20,
  })
  phoneNumberContact!: string | null;

  @Column("character varying", {
    name: "address_no",
    nullable: true,
    length: 20,
  })
  addressNo!: string | null;

  @Column("character varying", { name: "moo", nullable: true, length: 3 })
  moo!: string | null;

  @Column("character varying", { name: "soi", nullable: true, length: 50 })
  soi!: string | null;

  @Column("character varying", { name: "road", nullable: true, length: 30 })
  road!: string | null;

  @Column("character varying", {
    name: "district_province_id",
    nullable: true,
    length: 6,
  })
  districtProvinceId!: string | null;

  @Column("character varying", { name: "zip_code", nullable: true, length: 5 })
  zipCode!: string | null;

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
}
