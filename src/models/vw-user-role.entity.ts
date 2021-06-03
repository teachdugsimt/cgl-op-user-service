import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  expression!: `
  SELECT ur.id,
    ur.user_id,
    ur.role_id,
    re.id AS resource_id,
    ra.action,
    ra.url
  FROM user_role ur
    LEFT JOIN role ro ON ro.id = ur.role_id
    LEFT JOIN resource_action ra ON ra.role_id = ur.role_id
    LEFT JOIN resource re ON re.id = ra.resource_id;
  `
})
export class VwUserRoleResource {

  @ViewColumn()
  id!: number

  @ViewColumn()
  user_id!: number

  @ViewColumn()
  role_id!: number

  @ViewColumn()
  resource_id!: number

  @ViewColumn()
  action!: string

  @ViewColumn()
  url!: number

}
