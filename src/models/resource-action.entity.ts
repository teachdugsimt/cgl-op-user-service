import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("resource_action_pkey", ["id"], { unique: true })
@Entity("resource_action", { schema: "public" })
export class ResourceAction {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("integer", { name: "role_id", nullable: true })
  roleId!: number | null;

  @Column("integer", { name: "resource_id", nullable: true })
  resourceId!: number | null;

  @Column("character varying", { name: "action", nullable: true, length: 20 })
  action!: string | null;

  @Column("character varying", { name: "url", nullable: true, length: 100 })
  url!: string | null;
}
