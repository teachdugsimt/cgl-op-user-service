import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("role", { schema: "public" })
export class Role {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("character varying", {
    name: "fullname",
    nullable: true,
    length: 255,
  })
  fullname!: string | null;

  @Column("character varying", { name: "name", nullable: true, length: 255 })
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

  @Column("boolean", { name: "is_deleted", default: () => "false" })
  isDeleted!: boolean;
}
