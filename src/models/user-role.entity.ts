import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("user_role_pkey", ["id"], { unique: true })
@Entity("user_role", { schema: "public" })
export class UserRole {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("integer", { name: "user_id", nullable: true })
  userId!: number | null;

  @Column("integer", { name: "role_id", nullable: true })
  roleId!: number | null;
}
