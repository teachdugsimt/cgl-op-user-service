import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("term_of_service_pkey", ["id"], { unique: true })
@Entity("term_of_service", { schema: "public" })
export class TermOfService {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("character varying", {
    name: "version_number",
    nullable: true,
    length: 50,
  })
  versionNumber!: string | null;

  @Column("text", { name: "data", nullable: true })
  data!: string | null;

  @Column("boolean", { name: "is_active", default: () => "true" })
  isActive!: boolean;

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
