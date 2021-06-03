import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  expression: `
  SELECT ur.id,
    ur.user_id,
    ur.role_id,
    ro.fullname AS role_name
  FROM user_role ur
    LEFT JOIN role ro ON ro.id = ur.role_id;
  `
})
export class VwUserRole {

  @ViewColumn()
  id!: number

  @ViewColumn()
  user_id!: number

  @ViewColumn()
  role_id!: number

}
