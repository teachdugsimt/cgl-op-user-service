import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("user_test", { schema: "public" })
export class UserTest {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id" })
  id!: string;

  @Column("varchar", { name: "phone_number", nullable: false })
  phoneNumber!: string | null;

  @Column("varchar", { name: "fullname", nullable: true })
  fullname!: string | null;
}
