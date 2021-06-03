import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("resource_pkey", ["id"], { unique: true })
@Entity("resource", { schema: "public" })
export class Resource {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("character varying", { name: "name", nullable: true, length: 50 })
  name!: string | null;

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
}
